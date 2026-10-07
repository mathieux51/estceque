import Link from 'next/link'
import {
  formatDate,
  formatDuration,
  shortTitle,
  type Episode,
} from '@/lib/content'
import { aushaImage } from '@/lib/images'
import { AUDIENCES } from '@/lib/projects'
import AushaPlayer from './AushaPlayer'

export default function EpisodeCard({ episode }: { episode: Episode }) {
  const image = aushaImage(episode.image)
  return (
    <article className='card flex flex-col gap-3'>
      <div className='flex gap-3'>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=''
            width={80}
            height={80}
            loading='lazy'
            className='h-20 w-20 shrink-0 rounded-md object-cover'
          />
        )}
        <div className='min-w-0'>
          <h3 className='leading-snug text-white'>
            <Link
              href={`/podcasts/${episode.slug}/`}
              className='hover:underline'
            >
              {shortTitle(episode)}
            </Link>
          </h3>
          <p className='mt-1 text-sm'>
            <Link
              href={`/projets/${episode.project.slug}/`}
              className='hover:text-white'
            >
              {episode.project.title}
            </Link>
            {' · '}
            {AUDIENCES[episode.project.audience]}
          </p>
          <p className='text-xs'>
            {formatDate(episode.publishedAt)}
            {episode.durationSeconds
              ? ` · ${formatDuration(episode.durationSeconds)}`
              : ''}
          </p>
        </div>
      </div>
      <AushaPlayer kind='episode' id={episode.id} title={episode.title} />
    </article>
  )
}
