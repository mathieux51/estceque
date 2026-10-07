import Link from 'next/link'

export default function NotFound() {
  return (
    <div className='space-y-4 py-10 text-center'>
      <h1 className='title text-4xl'>Page introuvable</h1>
      <p>
        Cette page n&apos;existe pas ou plus. L&apos;ancien blog a été remplacé
        par ce site.
      </p>
      <div className='flex flex-wrap justify-center gap-3'>
        <Link className='btn-primary' href='/'>
          Accueil
        </Link>
        <Link className='btn' href='/podcasts/'>
          Rechercher un podcast
        </Link>
      </div>
    </div>
  )
}
