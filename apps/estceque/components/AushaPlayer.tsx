'use client'

import { useEffect, useState } from 'react'
import { AUSHA_SHOW_ID } from '@/lib/site'
import PlayButton from './PlayButton'

type Props =
  | { kind: 'episode'; id: string; title: string; autoLoad?: boolean }
  | { kind: 'show'; title: string; autoLoad?: boolean }
  | { kind: 'playlist'; slug: string; title: string; autoLoad?: boolean }

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
  const playerId =
    props.kind === 'episode'
      ? `ausha-${props.id}`
      : props.kind === 'playlist'
        ? `ausha-playlist-${props.slug}`
        : 'ausha-show'
  const [height, setHeight] = useState(props.kind === 'episode' ? 220 : 460)
  const label = {
    episode: 'Écouter cet épisode',
    playlist: 'Écouter la playlist',
    show: 'Écouter tous les épisodes',
  }[props.kind]
  const query =
    props.kind === 'episode'
      ? `podcastId=${props.id}&playerId=${playerId}`
      : props.kind === 'playlist'
        ? `showId=${AUSHA_SHOW_ID}&playlistSlug=${props.slug}&playlist=true&playerId=${playerId}`
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
      <PlayButton
        label={label}
        title={props.title}
        onClick={() => setLoaded(true)}
      />
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
