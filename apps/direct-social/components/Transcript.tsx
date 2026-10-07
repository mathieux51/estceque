'use client'

import { useEffect, useRef } from 'react'
import { useApi } from '@/lib/api'
import { formatTime } from '@/lib/format'
import type { Segment } from '@/lib/types'

type Props = { episodeId: number; status: string; position: number | null; onSeek: (s: number) => void }

export default function Transcript({ episodeId, status, position, onSeek }: Props) {
  const { data } = useApi<{ status: string; segments: Segment[] }>(
    status === 'ready' ? `/episodes/${episodeId}/transcript` : null,
  )
  const list = useRef<HTMLOListElement>(null)
  const segments = data?.segments ?? []
  const active =
    position === null ? -1 : segments.findLastIndex((s) => s.start <= position + 0.2)

  useEffect(() => {
    const el = list.current?.children[active] as HTMLElement | undefined
    if (el && list.current) list.current.scrollTo({ top: el.offsetTop - list.current.offsetTop - 40, behavior: 'smooth' })
  }, [active])

  if (status === 'pending' || status === 'running')
    return <p className='text-sm'>Transcription en cours… Elle apparaîtra ici dans quelques minutes.</p>
  if (status === 'failed') return <p className='text-sm'>La transcription a échoué.</p>
  if (!segments.length) return <p className='text-sm'>Pas de paroles détectées.</p>
  return (
    <ol ref={list} className='max-h-80 space-y-1 overflow-y-auto pr-2' data-testid='transcript'>
      {segments.map((s, i) => (
        <li key={i}>
          <button
            onClick={() => onSeek(s.start)}
            className={`flex w-full gap-3 rounded px-2 py-1 text-left hover:bg-white/10 ${i === active ? 'bg-white/10 text-white' : ''}`}
          >
            <span className='w-12 shrink-0 text-xs leading-6 text-warning tabular-nums'>{formatTime(s.start)}</span>
            <span>{s.text}</span>
          </button>
        </li>
      ))}
    </ol>
  )
}
