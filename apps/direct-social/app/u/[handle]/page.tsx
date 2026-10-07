'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Avatar from '@/components/Avatar'
import ReportButton from '@/components/ReportButton'
import ShowCard from '@/components/ShowCard'
import { Empty, ErrorMessage, Loading } from '@/components/States'
import { api, useApi } from '@/lib/api'
import { formatAgo, formatTime, plural } from '@/lib/format'
import { useSession } from '@/lib/session'
import type { Profile } from '@/lib/types'

export default function ProfilePage() {
  const { handle } = useParams<{ handle: string }>()
  const router = useRouter()
  const { me } = useSession()
  const { data: p, error, setData, reload } = useApi<Profile>(`/users/${handle}`)
  if (error) return <ErrorMessage message={error.message} />
  if (!p) return <Loading />

  const follow = async () => {
    if (!me) return router.push(`/connexion?suite=/u/${p.handle}`)
    const on = !p.following
    setData({ ...p, following: on, followerCount: p.followerCount + (on ? 1 : -1) })
    await api(`/users/${p.id}/follow`, { method: on ? 'POST' : 'DELETE' }).catch(reload)
  }

  return (
    <div className='space-y-8'>
      <section className='flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left'>
        <Avatar user={p} size='lg' />
        <div className='flex-1 space-y-1'>
          <h1 className='title text-3xl'>{p.displayName}</h1>
          <p>@{p.handle}</p>
          <p className='text-sm'>
            {plural(p.followerCount, 'abonné', 'abonnés')} · {plural(p.followingCount, 'abonnement', 'abonnements')}
          </p>
          {p.bio && <p className='whitespace-pre-wrap pt-2'>{p.bio}</p>}
        </div>
        <div className='flex gap-2'>
          {p.isMe ? (
            <Link href='/moi' className='btn'>Modifier mon profil</Link>
          ) : (
            <button className={p.following ? 'btn' : 'btn-primary'} onClick={follow} aria-pressed={p.following}>
              {p.following ? 'Suivi' : 'Suivre'}
            </button>
          )}
          {!p.isMe && <ReportButton type='user' id={p.id} />}
        </div>
      </section>
      <section className='space-y-3'>
        <h2 className='title text-2xl'>Podcasts</h2>
        {p.shows.length ? (
          <div className='grid gap-3 sm:grid-cols-2 md:grid-cols-3'>
            {p.shows.map((s) => <ShowCard key={s.id} show={s} />)}
          </div>
        ) : (
          <Empty>Aucun podcast publié.</Empty>
        )}
      </section>
      {p.comments.length > 0 && (
        <section className='space-y-3'>
          <h2 className='title text-2xl'>Derniers commentaires</h2>
          <ul className='space-y-2'>
            {p.comments.map((c) => (
              <li key={c.id} className='card text-sm'>
                <span className='text-xs'>{formatAgo(c.createdAt)}</span>
                {c.atSeconds !== null && <span className='ml-2 text-xs text-warning'>{formatTime(c.atSeconds)}</span>}
                <p className='text-white/90'>{c.body || '🎙 Note audio'}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
