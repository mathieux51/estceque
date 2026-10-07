import Image from 'next/image'
import Link from 'next/link'
import AushaPlayer from '@/components/AushaPlayer'
import EpisodeCard from '@/components/EpisodeCard'
import EpisodeSearch from '@/components/EpisodeSearch'
import MapEmbed from '@/components/MapEmbed'
import ProjectCard from '@/components/ProjectCard'
import { CONTACT_EMAIL, episodes, projectsWithEpisodes } from '@/lib/content'
import { searchItems } from '@/lib/search'

const formats = [
  {
    title: 'Webradio scolaire en direct',
    text: 'Les élèves préparent, animent et enregistrent une émission en conditions de direct : chroniques, interviews, reportages.',
    examples: ['radio-nautilus', 'radio-alienor', 'la-voix-de-max'],
  },
  {
    title: 'Fiction et docu-fiction sonore',
    text: "Écrire un scénario, souvent à partir d'archives, le mettre en voix, l'habiller de sons et de musiques.",
    examples: ['lycee-pablo-picasso', 'super-bousier'],
  },
  {
    title: 'Podcast de savoir',
    text: 'À l’université, étudiantes, étudiants et doctorants transforment leurs recherches et leurs métiers en podcasts.',
    examples: ['podcasts-du-savoir', 'radio-alternante', 'traversees'],
  },
  {
    title: "Paroles d'habitants",
    text: 'Dans les structures sociales et les lieux de vie, chacun prend le micro pour raconter son histoire et son quartier.',
    examples: [
      'radio-des-sans-voix',
      'radio-du-cafe-de-la-route',
      'frequences-migrantes',
    ],
  },
]

export default function Home() {
  const groups = projectsWithEpisodes()
  const titles = new Map(
    groups.map((group) => [group.project.slug, group.project.title])
  )
  const firstYear = episodes[episodes.length - 1]?.publishedAt.slice(0, 4)

  return (
    <div className='space-y-16'>
      <section className='grid items-center gap-8 md:grid-cols-[1fr_auto]'>
        <div className='space-y-5'>
          <p className='text-sm uppercase tracking-wide text-warning'>
            Radio · Podcast · Éducation aux médias
          </p>
          <h1 className='title text-4xl leading-tight sm:text-5xl'>
            Est-ce que t&apos;entends ce que je vois ?
          </h1>
          <p className='max-w-2xl text-lg'>
            Média associatif de proximité d&apos;Éducation aux Médias et à
            l&apos;Information par le son, la radio et le podcast, implanté dans
            le Sud-Ouest de la France.
          </p>
          <p className='max-w-2xl'>
            Avec Blandine Schmidt, élèves, étudiants et habitants prennent le
            micro : webradios scolaires en direct, fictions et docu-fictions,
            podcasts de savoir, reportages. {episodes.length} épisodes à
            écouter, de {firstYear} à aujourd&apos;hui.
          </p>
          <div className='flex flex-wrap gap-3'>
            <Link href='/ateliers/' className='btn-primary'>
              Organiser un atelier radio
            </Link>
            <Link href='/podcasts/' className='btn'>
              Écouter les podcasts
            </Link>
          </div>
          <p className='text-sm'>Référencée Pass Culture (Adage).</p>
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

      <section aria-labelledby='recherche' className='space-y-4'>
        <h2 id='recherche' className='title text-3xl'>
          Trouver un podcast
        </h2>
        <EpisodeSearch
          items={searchItems()}
          projects={groups.map((g) => ({
            slug: g.project.slug,
            title: g.project.title,
          }))}
          limit={6}
        />
      </section>

      <section aria-labelledby='ateliers' className='space-y-6'>
        <div className='space-y-3'>
          <h2 id='ateliers' className='title text-3xl'>
            Ateliers radio et podcast avec Blandine Schmidt
          </h2>
          <p className='max-w-3xl'>
            Blandine Schmidt, docteure en Sciences de l&apos;Information et de
            la Communication, chargée de projet de l&apos;association et
            formatrice au CLEMI de l&apos;académie de Bordeaux, accompagne les
            classes, les universités et les structures sociales de
            l&apos;écriture à la diffusion : prise de son, interview, mise en
            ondes, montage et publication en podcast.
          </p>
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          {formats.map((format) => (
            <div key={format.title} className='card space-y-2'>
              <h3 className='font-display text-xl text-white'>
                {format.title}
              </h3>
              <p>{format.text}</p>
              <p className='text-sm'>
                À écouter :{' '}
                {format.examples
                  .filter((slug) => titles.has(slug))
                  .map((slug, i) => (
                    <span key={slug}>
                      {i > 0 && ', '}
                      <Link className='link' href={`/projets/${slug}/`}>
                        {titles.get(slug)}
                      </Link>
                    </span>
                  ))}
              </p>
            </div>
          ))}
        </div>
        <Link href='/ateliers/' className='btn-primary'>
          Découvrir les ateliers
        </Link>
      </section>

      <section aria-labelledby='projets' className='space-y-4'>
        <h2 id='projets' className='title text-3xl'>
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

      <section aria-labelledby='derniers' className='space-y-4'>
        <h2 id='derniers' className='title text-3xl'>
          Derniers épisodes
        </h2>
        <div className='grid gap-4 md:grid-cols-2'>
          {episodes.slice(0, 4).map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>
      </section>

      <section aria-labelledby='carte' className='space-y-4'>
        <h2 id='carte' className='title text-3xl'>
          L&apos;oreille voyageuse, la carte sonore
        </h2>
        <p className='max-w-3xl'>
          Une cartographie sonore et plurilingue en français langue-monde, née
          d&apos;une écriture collective au Département d&apos;Études de
          Français Langue Étrangère de l&apos;Université Bordeaux Montaigne.
          Cliquez sur une épingle pour écouter un conte.
        </p>
        <MapEmbed />
        <Link href='/oreille-voyageuse/' className='btn'>
          Tous les contes de la carte
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
          Un projet d&apos;atelier radio ou podcast dans votre école, votre
          collège, votre lycée, votre université ou votre structure ?
          Écrivez-nous.
        </p>
        <a className='btn-primary' href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
      </section>
    </div>
  )
}
