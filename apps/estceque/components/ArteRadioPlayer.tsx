'use client'

import { useState } from 'react'
import PlayButton from './PlayButton'

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
      <PlayButton
        label='Écouter le conte'
        title={title}
        onClick={() => setLoaded(true)}
      />
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
