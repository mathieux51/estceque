import { pageMetadata } from '@/lib/seo'
import ArteRadioPlayer from '@/components/ArteRadioPlayer'
import JsonLd from '@/components/JsonLd'
import MapEmbed from '@/components/MapEmbed'
import { SITE_URL, map } from '@/lib/content'

const description =
  "L'oreille voyageuse : une carte sonore et plurilingue de contes en français langue-monde, créés en podcast au DEFLE de l'Université Bordeaux Montaigne. Cliquez sur une épingle pour écouter."

export const metadata = pageMetadata({
  title: "L'oreille voyageuse, la carte sonore",
  description,
  path: '/oreille-voyageuse/',
})

export default function SoundMap() {
  const tales = map.places.filter((place) => place.player)
  const others = map.places.filter((place) => !place.player)
  return (
    <div className='space-y-10'>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Map',
          name: "L'oreille voyageuse",
          url: `${SITE_URL}/oreille-voyageuse/`,
          description,
          inLanguage: 'fr',
          mapType: 'https://schema.org/VenueMap',
          sameAs: map.url,
        }}
      />
      <section className='space-y-3'>
        <h1 className='title text-4xl'>L&apos;oreille voyageuse</h1>
        {map.intro.map((paragraph) => (
          <p key={paragraph} className='max-w-3xl'>
            {paragraph}
          </p>
        ))}
      </section>
      <MapEmbed height={560} />
      <p className='text-sm'>
        Carte réalisée sur{' '}
        <a className='link' href={map.url}>
          Framacarte
        </a>
        , fond de carte © les contributeurs OpenStreetMap.
      </p>
      <section aria-labelledby='contes' className='space-y-4'>
        <h2 id='contes' className='title text-3xl'>
          Les contes à écouter
        </h2>
        <ul className='grid gap-4 md:grid-cols-2'>
          {tales.map((place) => (
            <li key={place.name} className='card space-y-3'>
              <h3 className='text-lg text-white'>{place.name}</h3>
              <ArteRadioPlayer src={place.player!} title={place.name} />
            </li>
          ))}
        </ul>
      </section>
      {others.map((place) => (
        <section key={place.name} className='card space-y-2'>
          <h2 className='font-display text-2xl text-white'>{place.name}</h2>
          {place.text.split('\n').map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>
      ))}
    </div>
  )
}
