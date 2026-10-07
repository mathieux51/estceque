'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ErrorMessage, Loading, SignInPrompt } from '@/components/States'
import { api, ApiError, useApi } from '@/lib/api'
import { useSession } from '@/lib/session'
import type { Episode, Show } from '@/lib/types'
import { uploadAudio } from '@/lib/upload'

function Publish() {
  const { me, ready } = useSession()
  const router = useRouter()
  const params = useSearchParams()
  const shows = useApi<Show[]>(me ? '/me/shows' : null)
  const [showId, setShowId] = useState(params.get('podcast') ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!showId && shows.data?.length) setShowId(String(shows.data[0].id))
  }, [shows.data, showId])

  if (!ready) return <Loading />
  if (!me) return <SignInPrompt what='publier un épisode' />
  if (shows.loading && !shows.data) return <Loading />
  if (shows.data && !shows.data.length)
    return (
      <div className='card space-y-3 text-center'>
        <p>Créez d’abord votre podcast, puis publiez-y des épisodes.</p>
        <Link href='/podcasts/nouveau' className='btn-primary'>Créer un podcast</Link>
      </div>
    )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setError(null)
    setProgress(0)
    try {
      const uploadKey = await uploadAudio(file, setProgress)
      const episode = await api<Episode>(`/shows/${showId}/episodes`, {
        method: 'POST',
        json: { title, description, tags: tags.split(','), uploadKey },
      })
      router.push(`/episodes/${episode.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
      setProgress(null)
    }
  }

  return (
    <div className='mx-auto max-w-xl space-y-4'>
      <h1 className='title text-3xl'>Publier un épisode</h1>
      <form onSubmit={submit} className='card space-y-3'>
        <div>
          <label className='label' htmlFor='show'>Podcast</label>
          <select id='show' className='input' value={showId} onChange={(e) => setShowId(e.target.value)}>
            {shows.data?.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <Link href='/podcasts/nouveau' className='mt-1 inline-block text-sm hover:text-white'>+ Nouveau podcast</Link>
        </div>
        <div>
          <label className='label' htmlFor='file'>Fichier audio (MP3, WAV, M4A, OGG, FLAC… 1 Go au plus)</label>
          <input
            id='file'
            type='file'
            accept='audio/*,.mp3,.wav,.m4a,.ogg,.opus,.flac,.webm,.aiff'
            required
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              setFile(f)
              if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '))
            }}
          />
          <p className='mt-1 text-xs'>
            Astuce : enregistrez et montez vos épisodes avec{' '}
            <a className='link' href='https://directpodcast.fr' target='_blank' rel='noreferrer'>Direct Podcast</a> et{' '}
            <a className='link' href='https://directmontage.fr' target='_blank' rel='noreferrer'>Direct Montage</a>.
          </p>
        </div>
        <div>
          <label className='label' htmlFor='title'>Titre</label>
          <input id='title' className='input' value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        </div>
        <div>
          <label className='label' htmlFor='description'>Description</label>
          <textarea id='description' className='input min-h-28' value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className='label' htmlFor='tags'>Mots-clés, séparés par des virgules</label>
          <input id='tags' className='input' value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        {progress !== null && (
          <div className='space-y-1' role='status'>
            <div className='h-2 overflow-hidden rounded bg-deep'>
              <div className='h-full bg-white transition-[width]' style={{ width: `${progress * 100}%` }} />
            </div>
            <p className='text-xs'>Envoi… {Math.round(progress * 100)} %</p>
          </div>
        )}
        {error && <ErrorMessage message={error} />}
        <button className='btn-primary w-full' disabled={progress !== null || !file || !showId}>Publier</button>
      </form>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <Publish />
    </Suspense>
  )
}
