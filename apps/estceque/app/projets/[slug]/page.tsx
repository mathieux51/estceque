import type { Metadata } from 'next'
import { aushaImage } from '@/lib/images'
import { pageMetadata } from '@/lib/seo'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import EpisodeCard from '@/components/EpisodeCard'
import JsonLd from '@/components/JsonLd'
import { SITE_URL, findProject, projectsWithEpisodes } from '@/lib/content'
import { AUDIENCES } from '@/lib/projects'

type Params = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return projectsWithEpisodes().map(({ project }) => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const group = findProject((await params).slug)
  if (!group) return {}
  const { project, episodes } = group
  return pageMetadata({
    title: `${project.title} : podcast, ${project.partner}`,
    description: project.summary,
    path: `/projets/${project.slug}/`,
    image: aushaImage(episodes[0]?.image ?? null, 1400),
  })
}

export default async function ProjectPage({ params }: Params) {
  const group = findProject((await params).slug)
  if (!group) notFound()
  const { project, episodes } = group
  // Credit Blandine Schmidt only where the episodes themselves do.
  const credited = episodes.some((episode) =>
    episode.paragraphs.some((p) => p.includes('Blandine Schmidt'))
  )
  const url = `${SITE_URL}/projets/${project.slug}/`
  return (
    <div className='space-y-8'>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWorkSeries',
          '@id': `${url}#projet`,
          name: project.title,
          url,
          description: project.summary,
          inLanguage: 'fr',
          locationCreated: { '@type': 'Place', name: project.place },
          audience: {
            '@type': 'Audience',
            audienceType: AUDIENCES[project.audience],
          },
          producer: { '@id': `${SITE_URL}/#association` },
          hasPart: episodes.map((episode) => ({
            '@id': `${SITE_URL}/podcasts/${episode.slug}/#episode`,
          })),
        }}
      />
      <nav aria-label="Fil d'Ariane" className='text-sm'>
        <Link href='/projets/' className='hover:text-white'>
          Projets
        </Link>
      </nav>
      <section className='space-y-3'>
        <p className='text-sm uppercase tracking-wide text-warning'>
          {AUDIENCES[project.audience]} · {project.place}
        </p>
        <h1 className='title text-4xl'>{project.title}</h1>
        <p className='text-lg'>{project.partner}</p>
        <p className='max-w-3xl'>{project.summary}</p>
        <p className='text-sm'>
          {credited
            ? 'Accompagnement : Blandine Schmidt pour le média associatif'
            : 'Un projet accompagné par le média associatif'}{' '}
          Est-ce que t&apos;entends ce que je vois ?
        </p>
      </section>
      <section aria-labelledby='episodes' className='space-y-4'>
        <h2 id='episodes' className='title text-2xl'>
          {episodes.length} épisode{episodes.length > 1 ? 's' : ''}
        </h2>
        <div className='grid gap-4 md:grid-cols-2'>
          {episodes.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>
      </section>
      <p>
        <Link className='btn' href='/ateliers/'>
          Organiser un atelier comme celui-ci
        </Link>
      </p>
    </div>
  )
}
