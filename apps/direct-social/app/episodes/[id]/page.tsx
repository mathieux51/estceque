'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Avatar from '@/components/Avatar'
import CommentForm from '@/components/CommentForm'
import CommentList from '@/components/CommentList'
import Cover from '@/components/Cover'
import EditEpisode from '@/components/EditEpisode'
import ReportButton from '@/components/ReportButton'
import Transcript from '@/components/Transcript'
import Waveform from '@/components/Waveform'
import { BookmarkIcon, HeartIcon, PauseIcon, PlayIcon, ShareIcon } from '@/components/Icons'
import { ErrorMessage, Loading, SignInPrompt } from '@/components/States'
import { api, useApi } from '@/lib/api'
import { formatAgo, formatDuration, formatTime, parseTime, plural } from '@/lib/format'
import { usePlayer } from '@/lib/player'
import { useSession } from '@/lib/session'
import type { Comment, Episode } from '@/lib/types'

function EpisodePage() {
  const { id } = useParams<{ id: string }>()
  const params = useSearchParams()
  const router = useRouter()
  const { me } = useSession()
  const player = usePlayer()
  const { data: episode, error, setData: setEpisode, reload } = useApi<Episode>(`/episodes/${id}`)
  const comments = useApi<Comment[]>(`/episodes/${id}/comments`)
  const [editing, setEditing] = useState(false)
  const [shareAtTime, setShareAtTime] = useState(true)
  const [copied, setCopied] = useState(false)
  const sharedTime = parseTime(params.get('t'))

  // Processing happens in the background: check again until it is done.
  const pending = episode && (episode.status === 'processing' || ['pending', 'running'].includes(episode.transcriptStatus))
  useEffect(() => {
    if (!pending) return
    const timer = setInterval(reload, 4000)
    return () => clearInterval(timer)
  }, [pending, reload])

  if (error) return <ErrorMessage message={error.message} />
  if (!episode) return <Loading />

  const current = player.episode?.id === episode.id
  const position = current ? player.time : null
  const duration = episode.durationSeconds ?? 0
  const playAt = (seconds?: number) => {
    if (current && seconds !== undefined) {
      player.seek(seconds)
      if (!player.playing) player.toggle()
    } else if (current) player.toggle()
    else player.play(episode, seconds)
  }

  const toggle = async (what: 'like' | 'bookmark') => {
    if (!me) return router.push(`/connexion?suite=/episodes/${episode.id}`)
    const on = what === 'like' ? !episode.liked : !episode.bookmarked
    setEpisode({
      ...episode,
      ...(what === 'like' ? { liked: on, likeCount: episode.likeCount + (on ? 1 : -1) } : { bookmarked: on }),
    })
    await api(`/episodes/${episode.id}/${what}`, { method: on ? 'POST' : 'DELETE' }).catch(reload)
  }

  const shareTime = Math.floor(position ?? sharedTime ?? 0)
  const share = async () => {
    const url = `${window.location.origin}/episodes/${episode.id}${shareAtTime && shareTime ? `?t=${shareTime}` : ''}`
    if (navigator.share) {
      try {
        await navigator.share({ title: episode.title, url })
        return
      } catch {}
    }
    await navigator.clipboard?.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const remove = async () => {
    if (!window.confirm('Supprimer cet épisode, ses commentaires et ses notes audio ?')) return
    await api(`/episodes/${episode.id}`, { method: 'DELETE' })
    router.replace(`/podcasts/${episode.show.slug}`)
  }

  return (
    <div className='space-y-8'>
      <section className='flex flex-col gap-4 sm:flex-row'>
        <Link href={`/podcasts/${episode.show.slug}`}>
          <Cover url={episode.show.coverUrl} title={episode.show.title} className='h-36 w-36' />
        </Link>
        <div className='min-w-0 flex-1 space-y-2'>
          <Link href={`/podcasts/${episode.show.slug}`} className='text-sm hover:underline'>
            {episode.show.title}
          </Link>
          <h1 className='title text-3xl'>{episode.title}</h1>
          <p className='flex flex-wrap items-center gap-x-3 text-sm'>
            <Link href={`/u/${episode.show.owner.handle}`} className='inline-flex items-center gap-1.5 hover:underline'>
              <Avatar user={episode.show.owner} size='sm' /> {episode.show.owner.displayName}
            </Link>
            <span>{formatAgo(episode.publishedAt ?? episode.createdAt)}</span>
            {duration > 0 && <span>{formatDuration(duration)}</span>}
            <span>{plural(episode.playCount, 'écoute', 'écoutes')}</span>
          </p>
          {episode.tags.length > 0 && (
            <p className='flex flex-wrap gap-2'>
              {episode.tags.map((t) => (
                <Link key={t} href={`/recherche?tag=${encodeURIComponent(t)}`} className='text-sm text-white hover:underline'>
                  #{t}
                </Link>
              ))}
            </p>
          )}
        </div>
      </section>

      {episode.status === 'processing' && (
        <p className='card text-warning' role='status'>
          Traitement en cours : conversion, forme d’onde, empreinte audio puis transcription.
        </p>
      )}
      {episode.status === 'failed' && <ErrorMessage message='Le traitement du fichier audio a échoué. Essayez un autre fichier.' />}

      {episode.status === 'ready' && (
        <section className='space-y-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <button className='btn-primary h-11 rounded-full px-5' onClick={() => playAt()} data-testid='episode-play'>
              {current && player.playing ? <PauseIcon /> : <PlayIcon />}
              {current && player.playing ? 'Pause' : current ? 'Reprendre' : 'Écouter'}
            </button>
            {sharedTime !== null && !current && (
              <button className='btn h-11' onClick={() => playAt(sharedTime)} data-testid='play-shared-time'>
                <PlayIcon /> Écouter à partir de {formatTime(sharedTime)}
              </button>
            )}
            <span className='ml-auto' />
            <button className={`btn ${episode.liked ? 'text-danger' : ''}`} onClick={() => toggle('like')} aria-pressed={episode.liked} aria-label="J'aime">
              <HeartIcon filled={episode.liked} /> {episode.likeCount}
            </button>
            <button className='btn' onClick={() => toggle('bookmark')} aria-pressed={episode.bookmarked} aria-label='À écouter plus tard'>
              <BookmarkIcon filled={episode.bookmarked} />
            </button>
            <button className='btn' onClick={share}>
              <ShareIcon /> {copied ? 'Lien copié !' : 'Partager'}
            </button>
            <ReportButton type='episode' id={episode.id} />
          </div>
          {shareTime > 0 && (
            <label className='flex items-center justify-end gap-1.5 text-sm'>
              <input type='checkbox' className='accent-white' checked={shareAtTime} onChange={(e) => setShareAtTime(e.target.checked)} />
              Partager à partir de {formatTime(shareTime)}
            </label>
          )}
          <Waveform
            peaks={episode.waveform ?? []}
            duration={duration}
            progress={position ?? sharedTime ?? 0}
            onSeek={playAt}
            markers={(comments.data ?? [])
              .filter((c) => c.atSeconds !== null)
              .map((c) => ({ at: c.atSeconds!, label: c.body || 'Note audio', audio: !!c.audioUrl }))}
          />
        </section>
      )}

      {episode.canEdit && (
        <section className='flex flex-wrap gap-2'>
          {editing ? (
            <div className='w-full'>
              <EditEpisode
                episode={episode}
                onCancel={() => setEditing(false)}
                onSaved={(saved) => {
                  setEpisode(saved)
                  setEditing(false)
                }}
              />
            </div>
          ) : (
            <>
              <button className='btn' onClick={() => setEditing(true)}>Modifier l’épisode</button>
              <button className='btn-danger' onClick={remove}>Supprimer</button>
            </>
          )}
        </section>
      )}

      {episode.description && <p className='whitespace-pre-wrap'>{episode.description}</p>}

      <div className='grid gap-8 lg:grid-cols-2'>
        <section className='space-y-4'>
          <h2 className='title text-2xl'>
            Commentaires {comments.data && comments.data.length > 0 && `(${comments.data.length})`}
          </h2>
          {episode.status === 'ready' &&
            (me ? (
              <CommentForm
                episodeId={episode.id}
                position={position}
                onPosted={(c) => comments.setData([...(comments.data ?? []), c])}
              />
            ) : (
              <SignInPrompt what='commenter ou laisser une note audio' />
            ))}
          {comments.data && (
            <CommentList
              episodeId={episode.id}
              comments={comments.data}
              onSeek={playAt}
              onChange={comments.setData}
            />
          )}
        </section>
        {episode.status === 'ready' && (
          <section className='space-y-4'>
            <h2 className='title text-2xl'>Transcription</h2>
            <Transcript episodeId={episode.id} status={episode.transcriptStatus} position={position} onSeek={playAt} />
          </section>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <EpisodePage />
    </Suspense>
  )
}
