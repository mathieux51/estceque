'use client'

import { useState } from 'react'
import { AUSHA_SHOW_ID } from '@/lib/site'

type Props =
  | { kind: 'episode'; id: string; title: string; autoLoad?: boolean }
  | { kind: 'show'; title: string; autoLoad?: boolean }

/**
 * Ausha's player, loaded when the visitor asks for it: pages stay fast and
 * nothing is requested from Ausha until someone wants to listen.
 */
export default function AushaPlayer(props: Props) {
  const [loaded, setLoaded] = useState(props.autoLoad ?? false)
  const query =
    props.kind === 'episode'
      ? `podcastId=${props.id}&playerId=ausha-${props.id}`
      : `showId=${AUSHA_SHOW_ID}&playlist=true&multishow=true&playerId=ausha-show`
  const height = props.kind === 'episode' ? 220 : 460

  if (!loaded) {
    return (
      <button
        type='button'
        onClick={() => setLoaded(true)}
        className='flex w-full items-center gap-3 rounded-lg border border-grey/40 bg-deep px-4 py-3 text-left transition-colors hover:border-white'
        aria-label={`Écouter : ${props.title}`}
      >
        <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-brand'>
          <svg
            viewBox='0 0 24 24'
            className='h-5 w-5'
            aria-hidden='true'
            fill='currentColor'
          >
            <path d='M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z' />
          </svg>
        </span>
        <span className='min-w-0'>
          <span className='block text-white'>
            {props.kind === 'episode'
              ? 'Écouter cet épisode'
              : 'Écouter tous les épisodes'}
          </span>
          <span className='block text-xs'>Lecteur Ausha</span>
        </span>
      </button>
    )
  }
  return (
    <iframe
      title={`Lecteur Ausha : ${props.title}`}
      src={`https://player.ausha.co/?${query}&color=%23005064&v=3`}
      loading='lazy'
      width='100%'
      height={height}
      className='w-full rounded-lg border-0'
      allow='autoplay; clipboard-write'
    />
  )
}
