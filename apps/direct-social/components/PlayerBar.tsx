'use client'

import Link from 'next/link'
import { usePlayer } from '@/lib/player'
import { formatTime } from '@/lib/format'
import Cover from './Cover'
import { BackIcon, ForwardIcon, PauseIcon, PlayIcon } from './Icons'

const rates = [1, 1.25, 1.5, 2, 0.75]

// PlayerBar keeps playing while people browse the site.
export default function PlayerBar() {
  const { episode, playing, time, duration, rate, toggle, seek, setRate } = usePlayer()
  if (!episode) return null
  const total = duration || episode.durationSeconds || 0
  return (
    <div
      data-testid='player-bar'
      className='fixed inset-x-0 bottom-0 z-40 border-t border-grey/40 bg-deep/95 backdrop-blur'
    >
      <div className='mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4'>
        <div className='flex min-w-0 items-center gap-3 sm:w-64'>
          <Cover url={episode.show.coverUrl} title={episode.show.title} className='h-11 w-11' />
          <div className='min-w-0'>
            <Link
              href={`/episodes/${episode.id}?t=${Math.floor(time)}`}
              className='block truncate text-sm font-medium text-white hover:underline'
            >
              {episode.title}
            </Link>
            <p className='truncate text-xs'>{episode.show.title}</p>
          </div>
        </div>
        <div className='flex flex-1 items-center gap-2'>
          <button className='btn h-9 w-9 px-0' onClick={() => seek(time - 15)} aria-label='Reculer de 15 secondes'>
            <BackIcon />
          </button>
          <button
            className='btn-primary h-10 w-10 rounded-full px-0'
            onClick={toggle}
            aria-label={playing ? 'Pause' : 'Lecture'}
            data-testid='player-toggle'
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className='btn h-9 w-9 px-0' onClick={() => seek(time + 30)} aria-label='Avancer de 30 secondes'>
            <ForwardIcon />
          </button>
          <span className='w-24 shrink-0 text-right text-xs tabular-nums' data-testid='player-time'>
            {formatTime(time)} / {formatTime(total)}
          </span>
          <input
            type='range'
            min={0}
            max={total || 1}
            step={0.1}
            value={Math.min(time, total || 1)}
            onChange={(e) => seek(Number(e.target.value))}
            className='min-w-0 flex-1 accent-white'
            aria-label='Position'
          />
          <button
            className='btn w-14 shrink-0 px-0 tabular-nums'
            onClick={() => setRate(rates[(rates.indexOf(rate) + 1) % rates.length])}
            aria-label='Vitesse de lecture'
          >
            ×{rate.toLocaleString('fr')}
          </button>
        </div>
      </div>
    </div>
  )
}
