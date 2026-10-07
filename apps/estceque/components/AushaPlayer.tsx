'use client'

import { useEffect, useState } from 'react'
import { AUSHA_SHOW_ID } from '@/lib/site'

type Props =
  | { kind: 'episode'; id: string; title: string; autoLoad?: boolean }
  | { kind: 'show'; title: string; autoLoad?: boolean }

const AUSHA_ORIGIN = 'https://player.ausha.co'

type AushaMessage = {
  source?: string
  name?: string
  payload?: { playerHeight?: number; playerId?: string; showSlug?: string }
}

/**
 * Ausha's player, loaded when the visitor asks for it: pages stay fast and
 * nothing is requested from Ausha until someone wants to listen.
 *
 * The player tells the page how tall it needs to be: on a phone it stacks
 * the cover above the controls and needs about 500px instead of 220px. This
 * component does what Ausha's embed script (ausha-player.js) does: it resizes
 * the iframe and answers the player's check for that script.
 */
export default function AushaPlayer(props: Props) {
  const [loaded, setLoaded] = useState(props.autoLoad ?? false)
  const playerId = props.kind === 'episode' ? `ausha-${props.id}` : 'ausha-show'
  const [height, setHeight] = useState(props.kind === 'episode' ? 220 : 460)
  const query =
    props.kind === 'episode'
      ? `podcastId=${props.id}&playerId=${playerId}`
      : `showId=${AUSHA_SHOW_ID}&playlist=true&multishow=true&playerId=${playerId}`

  useEffect(() => {
    if (!loaded) return
    const onMessage = (event: MessageEvent<AushaMessage>) => {
      if (
        event.origin !== AUSHA_ORIGIN ||
        event.data?.source !== 'ausha-player'
      )
        return
      const { name, payload } = event.data
      if (name === 'resize-player-iframe' && payload?.playerId === playerId) {
        if (payload.playerHeight && payload.playerHeight > 0)
          setHeight(payload.playerHeight)
      } else if (name === 'check-companion-script-loaded') {
        ;(event.source as WindowProxy | null)?.postMessage(
          {
            source: 'ausha-player-parent',
            name: 'confirm-companion-script-loaded',
          },
          event.origin
        )
      } else if (name === 'open-subscribe-modal' && payload?.showSlug) {
        // The "S'abonner" button: Ausha's page lists the listening apps.
        window.open(
          `https://subscribe.ausha.co/?slug=${encodeURIComponent(payload.showSlug)}&open=true`,
          '_blank',
          'noopener'
        )
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [loaded, playerId])

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
      id={playerId}
      title={`Lecteur Ausha : ${props.title}`}
      src={`${AUSHA_ORIGIN}/?${query}&color=%23005064&v=3`}
      width='100%'
      height={height}
      style={{ height }}
      className='w-full rounded-lg border-0 transition-[height]'
      allow='autoplay; clipboard-write; encrypted-media'
    />
  )
}
