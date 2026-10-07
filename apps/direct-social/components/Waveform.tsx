'use client'

import { useMemo, useState } from 'react'
import { formatTime } from '@/lib/format'

type Marker = { at: number; label: string; audio: boolean }

type Props = {
  peaks: number[]
  duration: number
  progress: number
  markers?: Marker[]
  onSeek: (seconds: number) => void
}

const BARS = 160

// Waveform of an episode: click to play from there; marks show comments.
export default function Waveform({ peaks, duration, progress, markers = [], onSeek }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const bars = useMemo(() => {
    if (!peaks.length) return Array(BARS).fill(0.15)
    const out: number[] = []
    const step = peaks.length / BARS
    for (let i = 0; i < BARS; i++) {
      let max = 0
      for (let j = Math.floor(i * step); j < Math.floor((i + 1) * step); j++) max = Math.max(max, peaks[j] ?? 0)
      out.push(max)
    }
    const top = Math.max(...out, 0.01)
    return out.map((v) => Math.max(0.06, v / top))
  }, [peaks])
  const ratio = duration ? progress / duration : 0
  const at = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - box.left) / box.width)) * duration
  }
  return (
    <div className='relative select-none'>
      <div
        role='slider'
        tabIndex={0}
        aria-label="Position dans l'épisode"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(progress)}
        data-testid='waveform'
        className='relative flex h-24 cursor-pointer items-center gap-px rounded-lg bg-deep px-2'
        onClick={(e) => onSeek(at(e))}
        onMouseMove={(e) => setHover(at(e))}
        onMouseLeave={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') onSeek(progress + 5)
          if (e.key === 'ArrowLeft') onSeek(progress - 5)
        }}
      >
        {bars.map((v, i) => (
          <span
            key={i}
            className={`flex-1 rounded-sm ${(i + 0.5) / BARS <= ratio ? 'bg-white' : 'bg-grey/50'}`}
            style={{ height: `${v * 100}%` }}
          />
        ))}
        {hover !== null && (
          <span className='pointer-events-none absolute -top-6 -translate-x-1/2 rounded bg-white px-1.5 text-xs text-brand'
            style={{ left: `${(hover / duration) * 100}%` }}>
            {formatTime(hover)}
          </span>
        )}
      </div>
      <div className='relative h-4'>
        {markers.map((m, i) => (
          <button
            key={i}
            title={`${formatTime(m.at)} · ${m.label}`}
            aria-label={`Commentaire à ${formatTime(m.at)}`}
            onClick={() => onSeek(m.at)}
            className={`absolute top-1 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-deep ${m.audio ? 'bg-warning' : 'bg-success'}`}
            style={{ left: `${duration ? (m.at / duration) * 100 : 0}%` }}
          />
        ))}
      </div>
    </div>
  )
}
