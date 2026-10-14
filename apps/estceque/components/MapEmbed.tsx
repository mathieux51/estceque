'use client'

import { useEffect, useRef, useState } from 'react'

const MAP_URL = 'https://framacarte.org/fr/map/l-oreille-voyageuse_239008'

// Only what an embed needs: the map's own settings on Framacarte (controls,
// base map, hidden base map switcher, starting view) apply otherwise.
// Wheel zoom is off so scrolling the page does not zoom the map.
const PARAMS =
  'editMode=disabled&embedControl=false&tilelayersControl=false&scrollWheelZoom=false&captionBar=false&onLoadPanel=none'

// The whole world at zoom 2 is 1024px wide: narrower frames start one step out
// so every continent is visible.
const PHONE_VIEW = '#1/30/10'

/** The "L'oreille voyageuse" map from Framacarte. */
export default function MapEmbed({ height = 480 }: { height?: number }) {
  const frame = useRef<HTMLDivElement>(null)
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    const width = frame.current?.clientWidth ?? 1024
    setSrc(`${MAP_URL}?${PARAMS}${width < 900 ? PHONE_VIEW : ''}`)
  }, [])

  return (
    <div ref={frame} style={{ height }}>
      {src && (
        <iframe
          title="Carte sonore L'oreille voyageuse (Framacarte)"
          src={src}
          loading='lazy'
          width='100%'
          height={height}
          className='w-full rounded-lg border border-grey/40'
          allowFullScreen
        />
      )}
    </div>
  )
}
