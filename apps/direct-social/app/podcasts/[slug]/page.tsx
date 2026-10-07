'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Avatar from '@/components/Avatar'
import Cover from '@/components/Cover'
import EpisodeCard from '@/components/EpisodeCard'
import ReportButton from '@/components/ReportButton'
import ShowForm from '@/components/ShowForm'
import { Empty, ErrorMessage, Loading } from '@/components/States'
import { api, useApi } from '@/lib/api'
import { plural } from '@/lib/format'
import { useSession } from '@/lib/session'
import type { Episode, Show } from '@/lib/types'

export default function ShowPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { me } = useSession()
  const { data, error, setData, reload } = useApi<{ show: Show; episodes: Episode[] }>(`/shows/${slug}`)
  const [editing, setEditing] = useState(false)
  if (error) return <ErrorMessage message={error.message} />
  if (!data) return <Loading />
  const { show, episodes } = data

  const follow = async () => {
    if (!me) return router.push(`/connexion?suite=/podcasts/${show.slug}`)
    const on = !show.following
    setData({ ...data, show: { ...show, following: on, followerCount: show.followerCount + (on ? 1 : -1) } })
    await api(`/shows/${show.id}/follow`, { method: on ? 'POST' : 'DELETE' }).catch(reload)
  }
  const remove = async () => {
    if (!window.confirm(`Supprimer « ${show.title} » et tous ses épisodes ?`)) return
    await api(`/shows/${show.id}`, { method: 'DELETE' })
    router.replace('/moi')
  }

  return (
    <div className='space-y-8'>
      {editing ? (
        <ShowForm
          show={show}
          onCancel={() => setEditing(false)}
          onSaved={(saved) => {
            setEditing(false)
            if (saved.slug !== slug) router.replace(`/podcasts/${saved.slug}`)
            else reload()
          }}
        />
      ) : (
        <section className='flex flex-col gap-5 sm:flex-row'>
          <Cover url={show.coverUrl} title={show.title} className='h-44 w-44' />
          <div className='min-w-0 flex-1 space-y-3'>
            <h1 className='title text-4xl'>{show.title}</h1>
            <Link href={`/u/${show.owner.handle}`} className='inline-flex items-center gap-2 hover:underline'>
              <Avatar user={show.owner} size='sm' /> {show.owner.displayName}
            </Link>
            <p className='text-sm'>
              {plural(show.episodeCount, 'épisode', 'épisodes')} · {plural(show.followerCount, 'abonné', 'abonnés')}
            </p>
            {show.description && <p className='whitespace-pre-wrap'>{show.description}</p>}
            {show.tags.length > 0 && (
              <p className='flex flex-wrap gap-2'>
                {show.tags.map((t) => (
                  <Link key={t} href={`/recherche?tag=${encodeURIComponent(t)}`} className='text-sm text-white hover:underline'>#{t}</Link>
                ))}
              </p>
            )}
            <div className='flex flex-wrap gap-2'>
              {show.canEdit ? (
                <>
                  <Link href={`/publier?podcast=${show.id}`} className='btn-primary'>Publier un épisode</Link>
                  <button className='btn' onClick={() => setEditing(true)}>Modifier</button>
                  <button className='btn-danger' onClick={remove}>Supprimer</button>
                </>
              ) : (
                <button className={show.following ? 'btn' : 'btn-primary'} onClick={follow} aria-pressed={show.following}>
                  {show.following ? 'Abonné' : "S'abonner"}
                </button>
              )}
              <a className='btn' href={`/api/shows/${show.slug}/rss`} target='_blank' rel='noreferrer'>Flux RSS</a>
              <ReportButton type='show' id={show.id} />
            </div>
          </div>
        </section>
      )}
      <section className='space-y-3'>
        <h2 className='title text-2xl'>Épisodes</h2>
        {episodes.length ? (
          <div className='grid gap-3 md:grid-cols-2'>
            {episodes.map((e) => <EpisodeCard key={e.id} episode={e} />)}
          </div>
        ) : (
          <Empty>Pas encore d’épisode.</Empty>
        )}
      </section>
    </div>
  )
}
