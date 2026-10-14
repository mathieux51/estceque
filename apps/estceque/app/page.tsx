import Image from 'next/image'
import Link from 'next/link'
import AushaPlayer from '@/components/AushaPlayer'
import ContactPerson from '@/components/ContactPerson'
import PlaylistCard from '@/components/PlaylistCard'
import ProjectCard from '@/components/ProjectCard'
import SocialLinks from '@/components/SocialLinks'
import {
  CONTACT_EMAIL,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  episodes,
  playlists,
  projectsWithEpisodes,
} from '@/lib/content'

const services = [
  'Studio de production sonore',
  'Accompagnement & réalisation de podcasts',
  "Atelier Éducation aux Médias et à l'Information (EMI)",
  'Studio de radio mobile - plateau radio Live',
  'Ressources et outils pédagogiques',
]

// "Notre écosystème": one card per space of the association.
const ecosystem = [
  {
    title: 'Espace scolaire',
    text: 'Ateliers radio et podcast',
    href: '/espace-scolaire/',
  },
  {
    title: 'Espace pro',
    text: 'Accompagnement & production de podcasts pour les professionnels et les institutions',
    href: '/studio/#pro',
  },
  {
    title: 'Espace recherche',
    text: 'Accompagnement & production de podcasts scientifiques et de vulgarisation scientifique',
    href: '/studio/#recherche',
  },
  {
    title: 'Espace pédagogique',
    text: 'Nos outils & ressources pédagogiques « maison » libres de droits',
    href: '/espace-pedagogique/',
  },
  {
    title: 'Le studio',
    text: 'Production de podcasts, accompagnement de projets numériques, création identité sonore, diffusion. Identité sonore, habillage sonore, jingle.',
    href: '/studio/#studio',
  },
]

export default function Home() {
  const groups = projectsWithEpisodes()

  return (
    <div className='space-y-16'>
      <section className='grid items-center gap-8 md:grid-cols-[1fr_auto]'>
        <div className='space-y-5'>
          <p className='text-sm font-bold tracking-wide text-warning uppercase'>
            Radio · Podcast · Éducation aux médias · Recherches · Pédagogie
          </p>
          <h1 className='title text-4xl leading-tight sm:text-5xl'>
            Est-ce que t&apos;entends ce que je vois ?
          </h1>
          <p className='max-w-2xl text-lg text-white'>
            Média associatif d&apos;expression par le son, la radio et le
            podcast
          </p>
          <ul className='max-w-2xl list-disc space-y-1 pl-5'>
            {services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
          <p className='max-w-2xl'>
            Implanté dans le Sud-Ouest de la France depuis 2007
            <br />
            Intervention en France et à l&apos;étranger
          </p>
          <p className='max-w-2xl text-sm'>
            Référencée Adage Pass Culture
            <br />
            Chorus Pro
          </p>
          <div className='flex flex-wrap gap-3'>
            <Link href='/espace-scolaire/' className='btn-primary'>
              Réserver un atelier radio - podcast
            </Link>
            <Link href='/studio/' className='btn'>
              Être accompagné pour produire son podcast
            </Link>
            <Link href='#trouver-un-podcast' className='btn'>
              Écouter un podcast
            </Link>
          </div>
        </div>
        <Image
          src='/mascotte-512.jpeg'
          alt="La mascotte de l'association crie dans un mégaphone"
          width={300}
          height={300}
          className='mx-auto rounded-2xl border border-grey/40 shadow-lg'
          priority
        />
      </section>

      <section aria-labelledby='reseaux' className='space-y-3'>
        <h2 id='reseaux' className='title text-3xl'>
          Nous suivre sur les réseaux sociaux
        </h2>
        <SocialLinks
          label="Réseaux sociaux de l'association"
          links={[
            { name: 'Facebook', url: FACEBOOK_URL },
            { name: 'Instagram', url: INSTAGRAM_URL },
          ]}
        />
      </section>

      <ContactPerson />

      <section aria-labelledby='ecosysteme' className='space-y-4'>
        <h2 id='ecosysteme' className='section-title'>
          Notre écosystème
        </h2>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {ecosystem.map((space) => (
            <Link
              key={space.href}
              href={space.href}
              className='card flex flex-col gap-2 transition-colors hover:border-white'
            >
              <span className='font-display text-xl text-white'>
                {space.title}
              </span>
              <span>{space.text}</span>
              <span className='mt-auto pt-2 text-sm text-white'>
                Découvrir →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section
        id='trouver-un-podcast'
        aria-labelledby='trouver'
        className='scroll-mt-6 space-y-4'
      >
        <h2 id='trouver' className='section-title'>
          Trouver un podcast
        </h2>
        <div className='grid gap-4 md:grid-cols-2'>
          {playlists.slice(0, 6).map((playlist) => (
            <PlaylistCard key={playlist.slug} playlist={playlist} />
          ))}
        </div>
        <div className='flex flex-wrap gap-3'>
          <a
            className='btn'
            href='https://podcast.ausha.co/estceque?list=playlists'
          >
            Toutes les playlists ({playlists.length})
          </a>
          <Link className='btn' href='/podcasts/'>
            Rechercher parmi les {episodes.length} épisodes
          </Link>
        </div>
      </section>

      <section aria-labelledby='projets' className='space-y-4'>
        <h2 id='projets' className='section-title'>
          Les projets
        </h2>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {groups.slice(0, 6).map(({ project, episodes: list }) => (
            <ProjectCard
              key={project.slug}
              project={project}
              count={list.length}
            />
          ))}
        </div>
        <Link href='/projets/' className='btn'>
          Tous les projets ({groups.length})
        </Link>
      </section>

      <section aria-labelledby='ausha' className='space-y-4'>
        <h2 id='ausha' className='title text-3xl'>
          Tout le podcast
        </h2>
        <p>
          Le podcast est aussi disponible sur les applications de podcast, à
          partir de{' '}
          <a className='link' href='https://podcast.ausha.co/estceque'>
            sa page Ausha
          </a>
          .
        </p>
        <AushaPlayer
          kind='show'
          title="Est-ce que t'entends ce que je vois ?"
        />
      </section>

      <section aria-labelledby='contact' className='card space-y-3'>
        <h2 id='contact' className='title text-3xl'>
          Contact
        </h2>
        <p>
          Un atelier radio ou podcast dans votre établissement, un podcast à
          produire pour votre structure ou votre équipe de recherche ?
          Écrivez-nous.
        </p>
        <a className='btn-primary' href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
      </section>
    </div>
  )
}
