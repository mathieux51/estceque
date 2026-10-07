import { pageMetadata } from '@/lib/seo'
import AushaPlayer from '@/components/AushaPlayer'
import EpisodeSearch from '@/components/EpisodeSearch'
import JsonLd from '@/components/JsonLd'
import {
  SITE_NAME,
  SITE_URL,
  episodes,
  projectsWithEpisodes,
  show,
} from '@/lib/content'
import { searchItems } from '@/lib/search'

const description = `Les ${episodes.length} épisodes du podcast ${SITE_NAME} : webradios scolaires, fictions et docu-fictions, podcasts de savoir et paroles d'habitants. Recherchez par titre, établissement, ville, public ou année.`

export const metadata = pageMetadata({
  title: 'Tous les podcasts',
  description,
  path: '/podcasts/',
})

export default function Podcasts() {
  const groups = projectsWithEpisodes()
  return (
    <div className='space-y-10'>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'PodcastSeries',
          '@id': `${SITE_URL}/podcasts/#podcast`,
          name: SITE_NAME,
          url: `${SITE_URL}/podcasts/`,
          description: show.paragraphs[0],
          inLanguage: 'fr',
          image: show.image,
          webFeed: show.feed,
          author: { '@id': `${SITE_URL}/#association` },
        }}
      />
      <section className='space-y-3'>
        <h1 className='title text-4xl'>Tous les podcasts</h1>
        <p className='max-w-3xl'>{description}</p>
      </section>
      <EpisodeSearch
        items={searchItems()}
        projects={groups.map((g) => ({
          slug: g.project.slug,
          title: g.project.title,
        }))}
      />
      <section aria-labelledby='lecteur' className='space-y-3'>
        <h2 id='lecteur' className='title text-2xl'>
          Écouter à la suite
        </h2>
        <AushaPlayer kind='show' title={SITE_NAME} />
        <p className='text-sm'>
          Flux RSS pour les applications de podcast :{' '}
          <a className='link break-all' href={show.feed}>
            {show.feed}
          </a>
        </p>
      </section>
    </div>
  )
}
