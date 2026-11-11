import Image from 'next/image'
import { MapPin } from 'lucide-react'
import { pageMetadata } from '@/lib/seo'
import ArteRadioPlayer from '@/components/ArteRadioPlayer'
import JsonLd from '@/components/JsonLd'
import MapEmbed from '@/components/MapEmbed'
import { SITE_URL, map } from '@/lib/content'

const DEFLE_URL = 'https://defle.u-bordeaux-montaigne.fr/fr/index.html'
const CLEFF_URL =
  'https://www.u-bordeaux-montaigne.fr/fr/formations/cleff-cite-des-langues.html'

/** Links the DEFLE and the CLEFF wherever their names appear in a text. */
function LinkInstitutions({ text }: { text: string }) {
  const names: [RegExp, string][] = [
    [
      /D[ée]partement d.[ÉE]tudes de Fran[çc]ais Langue [ÉE]trang[èe]re|DEFLE/,
      DEFLE_URL,
    ],
    [
      /Cit[ée] des Langues [ÉE]trang[èe]res, du Fran[çc]ais et des Francophonies|CLEFF/,
      CLEFF_URL,
    ],
  ]
  const parts: React.ReactNode[] = []
  let rest = text
  const done = new Set<string>()
  while (rest) {
    let first: { index: number; match: string; url: string } | null = null
    for (const [pattern, url] of names) {
      if (done.has(url)) continue
      const m = pattern.exec(rest)
      if (m && (!first || m.index < first.index))
        first = { index: m.index, match: m[0], url }
    }
    if (!first) {
      parts.push(rest)
      break
    }
    parts.push(rest.slice(0, first.index))
    parts.push(
      <a key={first.url} className='link' href={first.url}>
        {first.match}
      </a>
    )
    done.add(first.url)
    rest = rest.slice(first.index + first.match.length)
  }
  return <>{parts}</>
}

/** "Le titre. Un conte de A & B" → the title and the authors line. */
function splitTale(name: string) {
  const match = name.match(/^(.*?)\.\s+(Un conte .*)$/)
  return match
    ? { title: match[1], authors: match[2] }
    : { title: name, authors: null }
}

/**
 * The tale's cover on ArteRadio, saved at 160px in `public/contes/` under the
 * sound's id (the embed URL ends with it); the project's cover otherwise.
 */
function taleCover(player: string) {
  const id = player.match(/\/embed\/(\d+)/)?.[1]
  return id && TALE_COVERS.has(id)
    ? `/contes/${id}.jpg`
    : '/oreille-voyageuse.jpg'
}

const TALE_COVERS = new Set([
  '276281',
  '276282',
  '276285',
  '276287',
  '276288',
  '276289',
  '276293',
  '276294',
])

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
    <div className='theme-light space-y-10'>
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
      {/*
        On wide screens the cover sits right of the text, beside the space the
        text leaves within the map's width. On phones everything stacks in
        source order, which puts the cover after the subtitle.
      */}
      <section className='grid gap-x-10 gap-y-3 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-start'>
        <h1 className='font-display text-4xl text-brand md:col-start-1'>
          L&apos;oreille voyageuse
        </h1>
        <p className='max-w-3xl font-bold text-brand md:col-start-1'>
          Des voix, des histoires, des mondes à découvrir…
        </p>
        <Image
          src='/oreille-voyageuse.jpg'
          alt="Affiche de L'oreille voyageuse : cartographie sonore et plurilingue en français langue-monde, podcasts réalisés au DEFLE (Département d'Études de Français Langue Étrangère) à la CLEFF, Université Bordeaux Montaigne."
          width={1200}
          height={1200}
          sizes='(min-width: 768px) 22rem, 100vw'
          priority
          className='my-2 w-full max-w-sm justify-self-center rounded-lg border border-grey/40 shadow-lg md:col-start-2 md:row-span-6 md:row-start-1 md:my-0 md:max-w-none'
        />
        <p className='max-w-3xl md:col-start-1'>
          L&apos;oreille voyageuse est une cartographie sonore et plurilingue en
          français langue-monde née d&apos;une écriture collective au{' '}
          <a className='link' href={DEFLE_URL}>
            Département d&apos;Études de Français Langue Étrangère
          </a>{' '}
          (DEFLE) à la{' '}
          <a className='link' href={CLEFF_URL}>
            Cité des Langues Étrangères, du Français et des Francophonies
          </a>{' '}
          (CLEFF) de l&apos;Université Bordeaux Montaigne.
        </p>
        <p className='max-w-3xl md:col-start-1'>
          L&apos;objectif est de créer un espace de rencontre des langues et des
          cultures à travers la production de podcasts pédagogiques.
        </p>
        <p className='max-w-3xl md:col-start-1'>
          L&apos;interculturalité devient ainsi une source
          d&apos;enrichissement.
        </p>
        <p className='max-w-3xl font-bold text-brand md:col-start-1'>
          Pour écouter, il vous suffit de cliquer sur l&apos;épingle{' '}
          <MapPin
            aria-label='épingle'
            className='inline h-5 w-5 -translate-y-0.5 text-brand'
          />{' '}
          puis sur lecture ▶️.
        </p>
      </section>
      <MapEmbed height={560} />
      <p className='text-sm'>
        Carte réalisée sur{' '}
        <a className='link' href={map.url}>
          Framacarte
        </a>
      </p>
      <section aria-labelledby='contes' className='space-y-4'>
        <h2 id='contes' className='font-display text-3xl text-brand uppercase'>
          Les contes à écouter
        </h2>
        {/* Same cards as the playlists of the home page. */}
        <ul className='grid gap-4 md:grid-cols-2'>
          {tales.map((place) => {
            const { title, authors } = splitTale(place.name)
            return (
              <li key={place.name} className='card flex flex-col gap-3'>
                <div className='flex gap-3'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={taleCover(place.player!)}
                    alt=''
                    width={80}
                    height={80}
                    loading='lazy'
                    className='h-20 w-20 shrink-0 rounded-md object-cover'
                  />
                  <div className='min-w-0'>
                    <h3 className='leading-snug font-bold text-brand'>
                      {title}
                    </h3>
                    {authors && <p className='mt-1 text-sm'>{authors}</p>}
                  </div>
                </div>
                <div className='mt-auto'>
                  <ArteRadioPlayer src={place.player!} title={place.name} />
                </div>
              </li>
            )
          })}
        </ul>
      </section>
      <section className='card space-y-3'>
        <h2 className='font-display text-2xl text-brand uppercase'>
          Un projet porté par Est-ce que t&apos;entends ce que je vois ?
        </h2>
        <p>
          L&apos;oreille voyageuse s&apos;appuie sur l&apos;association « Est-ce
          que t&apos;entends ce que je vois ? » pour promouvoir et assurer la
          visibilité des travaux des étudiantes et des étudiants du DEFLE de
          l&apos;Université Bordeaux Montaigne. Elle a accompagné l&apos;équipe
          pédagogique dans la scénographie numérique, dans la conception de la
          cartographie sonore ainsi que dans la composition de l&apos;univers
          sonore et visuel du projet.
        </p>
        <p>
          Jingle : musique Julien PERROT (
          <a className='link' href='https://www.izakprod.com/'>
            IzaK Prod
          </a>
          ) en collaboration avec Blandine Schmidt pour le média associatif{' '}
          <a className='link' href={`${SITE_URL}/`}>
            Est-ce que t&apos;entends ce que je vois ?
          </a>
        </p>
      </section>
      {others.map((place) => (
        <section key={place.name} className='card space-y-2'>
          <h2 className='font-display text-2xl text-brand uppercase'>
            Le DEFLE à la CLEFF de l&apos;Université Bordeaux Montaigne
          </h2>
          {place.text.split('\n').map((line) => (
            <p key={line}>
              {/^https?:\/\//.test(line) ? (
                <a className='link break-all' href={line}>
                  {line.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              ) : (
                <LinkInstitutions text={line} />
              )}
            </p>
          ))}
        </section>
      ))}
    </div>
  )
}
