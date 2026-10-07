import type { MetadataRoute } from 'next'
import { SITE_URL, episodes, projectsWithEpisodes } from '@/lib/content'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const latest = episodes[0]?.publishedAt
  return [
    { url: `${SITE_URL}/`, lastModified: latest, priority: 1 },
    { url: `${SITE_URL}/ateliers/`, priority: 0.9 },
    { url: `${SITE_URL}/podcasts/`, lastModified: latest, priority: 0.8 },
    { url: `${SITE_URL}/projets/`, lastModified: latest, priority: 0.7 },
    { url: `${SITE_URL}/oreille-voyageuse/`, priority: 0.6 },
    ...projectsWithEpisodes().map(({ project, episodes: list }) => ({
      url: `${SITE_URL}/projets/${project.slug}/`,
      lastModified: list[0].publishedAt,
      priority: 0.6,
    })),
    ...episodes.map((episode) => ({
      url: `${SITE_URL}/podcasts/${episode.slug}/`,
      lastModified: episode.publishedAt,
      priority: 0.5,
    })),
  ]
}
