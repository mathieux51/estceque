import type { Metadata } from 'next'
import Link from 'next/link'

// Shown, with status 410, for the posts and archives of the old blog that used
// to live at this address (see worker/index.ts).
export const metadata: Metadata = {
  title: "Page de l'ancien blog",
  robots: { index: false, follow: true },
}

export default function OldBlog() {
  return (
    <div className='mx-auto max-w-2xl space-y-5 py-10 text-center'>
      <h1 className='title text-4xl'>
        Cette page de l&apos;ancien blog n&apos;existe plus
      </h1>
      <p>
        Le blog « Est-ce que t&apos;entends ce que je vois ? » (2007-2024) a été
        remplacé par ce site. Les créations sonores de l&apos;association sont
        désormais publiées dans son podcast.
      </p>
      <div className='flex flex-wrap justify-center gap-3'>
        <Link className='btn-primary' href='/podcasts/'>
          Écouter les podcasts
        </Link>
        <Link className='btn' href='/espace-scolaire/'>
          Les ateliers radio et podcast
        </Link>
        <Link className='btn' href='/'>
          Accueil
        </Link>
      </div>
    </div>
  )
}
