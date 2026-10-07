'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { Empty, Loading, SignInPrompt } from '@/components/States'
import { api, useApi } from '@/lib/api'
import { formatAgo, formatTime } from '@/lib/format'
import { useSession } from '@/lib/session'
import type { Notification } from '@/lib/types'

function describe(n: Notification): { text: React.ReactNode; href: string } {
  const who = <strong className='text-white'>{n.actor?.displayName ?? 'Quelqu’un'}</strong>
  const episode = n.episode && <em className='text-white not-italic'>{n.episode.title}</em>
  const at = n.comment?.atSeconds != null ? `?t=${Math.floor(n.comment.atSeconds)}` : ''
  const commentHref = n.episode ? `/episodes/${n.episode.id}${at}#commentaire-${n.comment?.id}` : '/'
  const what = n.comment?.hasAudio && !n.comment.body ? 'une note audio' : 'un commentaire'
  switch (n.kind) {
    case 'comment':
      return { text: <>{who} a laissé {what} sur {episode}{n.comment?.atSeconds != null && ` à ${formatTime(n.comment.atSeconds)}`}</>, href: commentHref }
    case 'reply':
      return { text: <>{who} vous a répondu sur {episode}</>, href: commentHref }
    case 'like':
      return { text: <>{who} aime {episode}</>, href: `/episodes/${n.episode?.id}` }
    case 'follow_show':
      return { text: <>{who} s’est abonné à {n.show?.title}</>, href: `/u/${n.actor?.handle}` }
    case 'follow_user':
      return { text: <>{who} vous suit</>, href: `/u/${n.actor?.handle}` }
    case 'new_episode':
      return { text: <>Nouvel épisode de {n.show?.title} : {episode}</>, href: `/episodes/${n.episode?.id}` }
  }
}

export default function Notifications() {
  const { me, ready, reload: reloadSession } = useSession()
  const { data } = useApi<Notification[]>(me ? '/notifications' : null)

  useEffect(() => {
    if (data?.some((n) => !n.read)) api('/notifications/read', { method: 'POST' }).then(reloadSession).catch(() => {})
  }, [data, reloadSession])

  if (!ready) return <Loading />
  if (!me) return <SignInPrompt what='voir vos notifications' />
  if (!data) return <Loading />
  return (
    <div className='space-y-4'>
      <h1 className='title text-3xl'>Notifications</h1>
      {data.length ? (
        <ul className='space-y-2' data-testid='notifications'>
          {data.map((n) => {
            const { text, href } = describe(n)
            return (
              <li key={n.id}>
                <Link href={href} className={`card flex items-center gap-3 hover:bg-white/10 ${n.read ? '' : 'border-white/70'}`}>
                  {n.actor && <Avatar user={n.actor} size='sm' />}
                  <div className='min-w-0 flex-1'>
                    <p>{text}</p>
                    {n.comment?.body && <p className='truncate text-sm'>« {n.comment.body} »</p>}
                  </div>
                  <span className='shrink-0 text-xs'>{formatAgo(n.createdAt)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <Empty>Rien de neuf pour l’instant.</Empty>
      )}
    </div>
  )
}
