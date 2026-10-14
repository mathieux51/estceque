import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'

const description =
  "Les outils et ressources pédagogiques « maison » de l'association Est-ce que t'entends ce que je vois ? : enregistrer et monter un podcast dans le navigateur, gratuitement et sans inscription."

export const metadata = pageMetadata({
  title: 'Espace pédagogique : outils et ressources',
  description,
  path: '/espace-pedagogique/',
})

const tools = [
  {
    name: 'Direct Podcast',
    url: 'https://directpodcast.fr',
    text: 'Enregistrer sa voix en un clic, directement dans le navigateur. Le fichier sonore se télécharge automatiquement, en WAV ou en MP3.',
  },
  {
    name: 'Direct Montage',
    url: 'https://directmontage.fr',
    text: 'Monter un podcast en ligne : plusieurs pistes, couper, copier, coller, fondus, volume, enregistrement sur une piste, export WAV et MP3.',
  },
]

export default function Pedagogy() {
  return (
    <div className='space-y-12'>
      <section className='space-y-4'>
        <h1 className='title text-4xl leading-tight'>
          Espace pédagogique
          <span className='block text-2xl sm:text-3xl'>
            Nos outils & ressources pédagogiques « maison » libres de droits
          </span>
        </h1>
        <p className='max-w-3xl text-lg'>
          Imaginés pour les ateliers de l&apos;association, ces outils
          fonctionnent dans le navigateur, sur ordinateur comme sur téléphone,
          gratuitement et sans inscription. Les sons restent sur votre appareil.
        </p>
      </section>
      <section aria-labelledby='outils' className='space-y-4'>
        <h2 id='outils' className='section-title'>
          Les outils
        </h2>
        <div className='grid gap-4 sm:grid-cols-2'>
          {tools.map((tool) => (
            <a
              key={tool.url}
              href={tool.url}
              className='card flex flex-col gap-2 transition-colors hover:border-white'
            >
              <span className='font-display text-2xl text-white'>
                {tool.name}
              </span>
              <span>{tool.text}</span>
              <span className='mt-auto pt-2 text-sm text-white'>
                {tool.url.replace('https://', '')} →
              </span>
            </a>
          ))}
        </div>
      </section>
      <p>
        Pour des exemples de productions réalisées en classe, voir{' '}
        <Link className='link' href='/espace-scolaire/'>
          l&apos;espace scolaire
        </Link>{' '}
        et{' '}
        <Link className='link' href='/projets/'>
          les projets
        </Link>
        .
      </p>
    </div>
  )
}
