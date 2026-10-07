'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from '@/lib/session'
import Avatar from './Avatar'
import { BellIcon, SearchIcon } from './Icons'

export default function Header() {
  const { me, ready } = useSession()
  const pathname = usePathname()
  const next = encodeURIComponent(pathname)
  return (
    <header className='sticky top-0 z-30 border-b border-grey/30 bg-brand/95 backdrop-blur'>
      <div className='mx-auto flex max-w-5xl items-center gap-3 px-4 py-3'>
        <Link href='/' className='mr-auto font-display text-2xl text-white'>
          Direct Social
        </Link>
        <Link href='/recherche' className='btn' aria-label='Rechercher'>
          <SearchIcon />
          <span className='hidden sm:inline'>Rechercher</span>
        </Link>
        {ready && me && (
          <>
            <Link href='/publier' className='btn-primary hidden sm:inline-flex'>
              Publier
            </Link>
            <Link href='/notifications' className='btn relative' aria-label='Notifications'>
              <BellIcon />
              {me.unreadNotifications > 0 && (
                <span
                  data-testid='unread-count'
                  className='absolute -top-1.5 -right-1.5 min-w-5 rounded-full bg-danger px-1 text-center text-xs leading-5 text-white'
                >
                  {me.unreadNotifications}
                </span>
              )}
            </Link>
            <Link href='/moi' aria-label='Mon compte'>
              <Avatar user={me} size='sm' />
            </Link>
          </>
        )}
        {ready && !me && (
          <Link href={`/connexion?suite=${next}`} className='btn-primary'>
            Se connecter
          </Link>
        )}
      </div>
    </header>
  )
}
