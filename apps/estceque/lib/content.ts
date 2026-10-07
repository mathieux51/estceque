import mapData from '@/data/map.json'
import podcastData from '@/data/podcast.json'
import { OTHER_PROJECT, PROJECTS, projectFor, type Project } from './projects'

export {
  AUSHA_SHOW_ID,
  CONTACT_EMAIL,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  SITE_NAME,
  SITE_URL,
} from './site'

export interface Episode {
  id: string
  slug: string
  title: string
  paragraphs: string[]
  publishedAt: string
  durationSeconds: number | null
  season: number | null
  image: string | null
  audioUrl: string
  audioBytes: number | null
  ausha: string
  project: Project
}

export interface MapPlace {
  name: string
  latitude: number
  longitude: number
  text: string
  player: string | null
}

export const show = podcastData.show

export const episodes: Episode[] = podcastData.episodes.map((episode) => ({
  ...episode,
  project: projectFor(episode.title),
}))

export const map = mapData as {
  title: string
  url: string
  intro: string[]
  places: MapPlace[]
}

export function findEpisode(slug: string): Episode | undefined {
  return episodes.find((episode) => episode.slug === slug)
}

/** Projects that have episodes, the most recent first. */
export function projectsWithEpisodes(): {
  project: Project
  episodes: Episode[]
}[] {
  const all = [...PROJECTS, OTHER_PROJECT]
  return all
    .map((project) => ({
      project,
      episodes: episodes.filter(
        (episode) => episode.project.slug === project.slug
      ),
    }))
    .filter((group) => group.episodes.length > 0)
    .sort((a, b) =>
      b.episodes[0].publishedAt.localeCompare(a.episodes[0].publishedAt)
    )
}

export function findProject(slug: string) {
  return projectsWithEpisodes().find((group) => group.project.slug === slug)
}

/** The episode's title without the project name and place repeated in it. */
export function shortTitle(episode: Episode): string {
  const project = episode.project
  let title = episode.title
  for (const part of [
    project.partner,
    project.place,
    ...project.partner.split(', '),
  ]) {
    title = title.replace(` - ${part}`, '')
  }
  return title.replace(/\s+-\s*$/, '').trim()
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${Math.max(1, minutes)} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
}

/** ISO 8601 duration for schema.org, e.g. PT10M42S. */
export function isoDuration(seconds: number | null): string | undefined {
  if (!seconds) return undefined
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s ? `${s}S` : ''}` || 'PT0S'
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
})

export const formatDate = (iso: string) => dateFormat.format(new Date(iso))

/** Short description for meta tags, from the first paragraphs. */
export function summary(paragraphs: string[], length = 160): string {
  const text = paragraphs.join(' ').replace(/\s+/g, ' ').trim()
  if (text.length <= length) return text
  return `${text.slice(0, length - 1).replace(/\s+\S*$/, '')}…`
}
