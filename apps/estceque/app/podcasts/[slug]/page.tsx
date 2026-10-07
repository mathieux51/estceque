import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AushaPlayer from '@/components/AushaPlayer'
import EpisodeCard from '@/components/EpisodeCard'
import JsonLd from '@/components/JsonLd'
import Paragraphs from '@/components/Paragraphs'
import {
  SITE_URL,
  episodes,
  findEpisode,
  formatDate,
  formatDuration,
  isoDuration,
  shortTitle,
  summary,
} from '@/lib/content'
import { aushaImage } from '@/lib/images'
import { AUDIENCES } from '@/lib/projects'

type Params = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return episodes.map((episode) => ({ slug: episode.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const episode = findEpisode((await params).slug)
  if (!episode) return {}
  const url = `/podcasts/${episode.slug}/`
  const description = summary(episode.paragraphs)
  const image = aushaImage(episode.image, 1400)
  return {
    title: shortTitle(episode),
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      publishedTime: episode.publishedAt,
      title: episode.title,
      description,
      url,
      images: image ? [{ url: image, width: 1400, height: 1400 }] : undefined,
      audio: [{ url: episode.audioUrl, type: 'audio/mpeg' }],
    },
  }
}

export default async function EpisodePage({ params }: Params) {
  const episode = findEpisode((await params).slug)
  if (!episode) notFound()
  const { project } = episode
  const image = aushaImage(episode.image)
  const siblings = episodes
    .filter(
      (other) => other.project.slug === project.slug && other.id !== episode.id
    )
    .slice(0, 4)
  const url = `${SITE_URL}/podcasts/${episode.slug}/`

  return (
    <article className='space-y-10'>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'PodcastEpisode',
              '@id': `${url}#episode`,
              url,
              name: episode.title,
              description: summary(episode.paragraphs, 500),
              datePublished: episode.publishedAt,
              timeRequired: isoDuration(episode.durationSeconds),
              inLanguage: 'fr',
              image: aushaImage(episode.image, 1400),
              associatedMedia: {
                '@type': 'MediaObject',
                contentUrl: episode.audioUrl,
                encodingFormat: 'audio/mpeg',
                duration: isoDuration(episode.durationSeconds),
              },
              partOfSeries: { '@id': `${SITE_URL}/podcasts/#podcast` },
              publisher: { '@id': `${SITE_URL}/#association` },
              contentLocation: { '@type': 'Place', name: project.place },
              audience: {
                '@type': 'Audience',
                audienceType: AUDIENCES[project.audience],
              },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Accueil',
                  item: `${SITE_URL}/`,
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Podcasts',
                  item: `${SITE_URL}/podcasts/`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: project.title,
                  item: `${SITE_URL}/projets/${project.slug}/`,
                },
                {
                  '@type': 'ListItem',
                  position: 4,
                  name: shortTitle(episode),
                  item: url,
                },
              ],
            },
          ],
        }}
      />

      <nav aria-label="Fil d'Ariane" className='text-sm'>
        <Link href='/podcasts/' className='hover:text-white'>
          Podcasts
        </Link>
        {' › '}
        <Link href={`/projets/${project.slug}/`} className='hover:text-white'>
          {project.title}
        </Link>
      </nav>

      <header className='flex flex-col gap-6 sm:flex-row'>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=''
            width={200}
            height={200}
            className='h-48 w-48 shrink-0 rounded-lg object-cover shadow-lg'
          />
        )}
        <div className='space-y-3'>
          <h1 className='title text-3xl leading-tight sm:text-4xl'>
            {episode.title}
          </h1>
          <p>
            {project.partner} · {project.place}
          </p>
          <p className='text-sm'>
            {AUDIENCES[project.audience]} · {formatDate(episode.publishedAt)}
            {episode.durationSeconds
              ? ` · ${formatDuration(episode.durationSeconds)}`
              : ''}
          </p>
        </div>
      </header>

      <AushaPlayer kind='episode' id={episode.id} title={episode.title} />

      <section className='max-w-3xl'>
        <Paragraphs paragraphs={episode.paragraphs} />
        <p className='text-sm'>
          Aussi sur{' '}
          <a className='link' href={episode.ausha}>
            Ausha
          </a>{' '}
          ·{' '}
          <a className='link' href={episode.audioUrl}>
            fichier MP3
          </a>
        </p>
      </section>

      {siblings.length > 0 && (
        <section aria-labelledby='autres' className='space-y-4'>
          <h2 id='autres' className='title text-2xl'>
            Dans le projet {project.title}
          </h2>
          <div className='grid gap-4 md:grid-cols-2'>
            {siblings.map((other) => (
              <EpisodeCard key={other.id} episode={other} />
            ))}
          </div>
          <Link href={`/projets/${project.slug}/`} className='btn'>
            Tout le projet
          </Link>
        </section>
      )}
    </article>
  )
}
