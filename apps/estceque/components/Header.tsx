import Image from 'next/image'
import Link from 'next/link'

const links = [
  { href: '/podcasts/', label: 'Podcasts' },
  { href: '/ateliers/', label: 'Ateliers' },
  { href: '/projets/', label: 'Projets' },
  { href: '/oreille-voyageuse/', label: 'Carte sonore' },
]

export default function Header() {
  return (
    <header className='border-b border-grey/30 bg-deep/60'>
      <div className='mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3'>
        <Link href='/' className='flex items-center gap-3' aria-label='Accueil'>
          <Image
            src='/mascotte-512.jpeg'
            alt=''
            width={44}
            height={44}
            className='rounded-full'
            priority
          />
          <span className='font-display text-lg leading-tight text-white'>
            Est-ce que t&apos;entends
            <br className='sm:hidden' /> ce que je vois ?
          </span>
        </Link>
        <nav aria-label='Navigation principale' className='ml-auto'>
          <ul className='flex flex-wrap gap-x-4 gap-y-1 text-sm'>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className='hover:text-white'>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
