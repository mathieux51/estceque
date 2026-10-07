'use client'

import { useState } from 'react'

/** An ArteRadio player for a tale of the map, loaded on demand. */
export default function ArteRadioPlayer({
  src,
  title,
}: {
  src: string
  title: string
}) {
  const [loaded, setLoaded] = useState(false)
  if (!loaded) {
    return (
      <button type='button' className='btn' onClick={() => setLoaded(true)}>
        Écouter le conte
      </button>
    )
  }
  return (
    <iframe
      title={`Lecteur ArteRadio : ${title}`}
      src={src}
      width='100%'
      height={160}
      className='w-full rounded-lg border-0'
      allow='autoplay'
    />
  )
}
