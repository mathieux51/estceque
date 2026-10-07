'use client'

import Link from 'next/link'
import { usePlayer } from '@/lib/player'
import { formatAgo, formatDuration } from '@/lib/format'
import type { Episode } from '@/lib/types'
import Cover from './Cover'
import { CommentIcon, HeartIcon, PauseIcon, PlayIcon } from './Icons'

export default function EpisodeCard({ episode }: { episode: Episode }) {
  const player = usePlayer()
  const current = player.episode?.id === episode.id
  const ready = episode.status === 'ready'
  const progress =
    episode.progressSeconds && episode.durationSeconds ? episode.progressSeconds / episode.durationSeconds : 0
  return (
    <article className='card flex gap-3' data-testid='episode-card'>
      <Link href={`/podcasts/${episode.show.slug}`} className='shrink-0'>
        <Cover url={episode.show.coverUrl} title={episode.show.title} />
      </Link>
      <div className='min-w-0 flex-1'>
        <Link href={`/episodes/${episode.id}`} className='line-clamp-2 font-medium text-white hover:underline'>
          {episode.title}
        </Link>
        <p className='truncate text-sm'>
          <Link href={`/podcasts/${episode.show.slug}`} className='hover:underline'>
            {episode.show.title}
          </Link>
          {' · '}
          {episode.show.owner.displayName}
        </p>
        <div className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
          {ready ? (
            <>
              <span>{formatAgo(episode.publishedAt)}</span>
              <span>{formatDuration(episode.durationSeconds)}</span>
              <span className='inline-flex items-center gap-1'>
                <HeartIcon className='h-3.5 w-3.5' filled={episode.liked} /> {episode.likeCount}
              </span>
              <span className='inline-flex items-center gap-1'>
                <CommentIcon className='h-3.5 w-3.5' /> {episode.commentCount}
              </span>
            </>
          ) : episode.status === 'processing' ? (
            <span className='text-warning'>Traitement en cours…</span>
          ) : (
            <span className='text-danger'>Échec du traitement</span>
          )}
        </div>
        {progress > 0 && (
          <div className='mt-2 h-1 overflow-hidden rounded bg-deep' title='Déjà écouté'>
            <div className='h-full bg-white' style={{ width: `${Math.min(100, progress * 100)}%` }} />
          </div>
        )}
      </div>
      {ready && (
        <button
          className='btn-primary h-10 w-10 shrink-0 self-center rounded-full px-0'
          aria-label={current && player.playing ? 'Pause' : `Écouter ${episode.title}`}
          onClick={() => (current ? player.toggle() : player.play(episode))}
        >
          {current && player.playing ? <PauseIcon /> : <PlayIcon />}
        </button>
      )}
    </article>
  )
}
