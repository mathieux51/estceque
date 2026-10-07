import type { SearchItem } from '@/components/EpisodeSearch'
import { normalize } from './normalize'
import { episodes, formatDate, formatDuration, shortTitle } from './content'
import { aushaImage } from './images'

/** A light index of every episode for the search on the page. */
export function searchItems(): SearchItem[] {
  return episodes.map((episode) => ({
    id: episode.id,
    slug: episode.slug,
    title: shortTitle(episode),
    project: episode.project.title,
    projectSlug: episode.project.slug,
    audience: episode.project.audience,
    place: episode.project.place,
    year: episode.publishedAt.slice(0, 4),
    date: formatDate(episode.publishedAt),
    duration: formatDuration(episode.durationSeconds),
    image: aushaImage(episode.image),
    text: normalize(
      [
        episode.title,
        episode.project.title,
        episode.project.partner,
        episode.project.place,
        episode.paragraphs.join(' ').slice(0, 600),
      ].join(' ')
    ),
  }))
}
