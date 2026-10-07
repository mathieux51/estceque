'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import AudioSearch from '@/components/AudioSearch'
import Avatar from '@/components/Avatar'
import Cover from '@/components/Cover'
import EpisodeCard from '@/components/EpisodeCard'
import Highlight from '@/components/Highlight'
import ShowCard from '@/components/ShowCard'
import { SearchIcon } from '@/components/Icons'
import { Empty, ErrorMessage, Loading } from '@/components/States'
import { useApi } from '@/lib/api'
import { formatTime } from '@/lib/format'
import { usePlayer } from '@/lib/player'
import type { SearchResults } from '@/lib/types'

function Search() {
  const params = useSearchParams()
  const router = useRouter()
  const player = usePlayer()
  const q = params.get('q') ?? ''
  const tag = params.get('tag') ?? ''
  const [text, setText] = useState(q)
  useEffect(() => setText(q), [q])
  const path = tag ? `/search?tag=${encodeURIComponent(tag)}` : q ? `/search?q=${encodeURIComponent(q)}` : null
  const { data, error, loading } = useApi<SearchResults>(path)
  const empty = data && !data.shows.length && !data.episodes.length && !data.moments.length && !data.users.length

  return (
    <div className='space-y-6'>
      <h1 className='title text-3xl'>{tag ? `#${tag}` : 'Rechercher'}</h1>
      <form
        className='flex gap-2'
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) router.push(`/recherche?q=${encodeURIComponent(text.trim())}`)
        }}
      >
        <input
          className='input'
          type='search'
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Un podcast, un sujet, une phrase entendue…'
          aria-label='Recherche'
        />
        <button className='btn-primary'>
          <SearchIcon /> Chercher
        </button>
      </form>

      <AudioSearch autoStart={params.get('ecoute') === '1'} />

      {error && <ErrorMessage message={error.message} />}
      {loading && <Loading />}
      {empty && <Empty>Aucun résultat pour « {q || tag} ».</Empty>}
      {data && (
        <>
          {data.moments.length > 0 && (
            <section className='space-y-3'>
              <h2 className='title text-2xl'>Dans les épisodes</h2>
              <ul className='space-y-2' data-testid='moments'>
                {data.moments.map((m, i) => (
                  <li key={i} className='card flex items-start gap-3'>
                    <Cover url={m.episode.show.coverUrl} title={m.episode.show.title} className='h-12 w-12' />
                    <div className='min-w-0 flex-1'>
                      <Link href={`/episodes/${m.episode.id}?t=${Math.floor(m.start)}`} className='font-medium text-white hover:underline'>
                        {m.episode.title}
                      </Link>
                      <p className='text-sm'>
                        <span className='mr-2 tabular-nums text-warning'>{formatTime(m.start)}</span>
                        « <Highlight text={m.snippet} /> »
                      </p>
                    </div>
                    <button className='btn shrink-0' onClick={() => player.play(m.episode, m.start)}>
                      Écouter
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {data.episodes.length > 0 && (
            <section className='space-y-3'>
              <h2 className='title text-2xl'>Épisodes</h2>
              <div className='grid gap-3 md:grid-cols-2'>
                {data.episodes.map((e) => (
                  <EpisodeCard key={e.id} episode={e} />
                ))}
              </div>
            </section>
          )}
          {data.shows.length > 0 && (
            <section className='space-y-3'>
              <h2 className='title text-2xl'>Podcasts</h2>
              <div className='grid gap-3 sm:grid-cols-2 md:grid-cols-3'>
                {data.shows.map((s) => (
                  <ShowCard key={s.id} show={s} />
                ))}
              </div>
            </section>
          )}
          {data.users.length > 0 && (
            <section className='space-y-3'>
              <h2 className='title text-2xl'>Personnes</h2>
              <div className='flex flex-wrap gap-2'>
                {data.users.map((u) => (
                  <Link key={u.id} href={`/u/${u.handle}`} className='card flex items-center gap-2 py-2 hover:bg-white/10'>
                    <Avatar user={u} size='sm' />
                    <span className='text-white'>{u.displayName}</span>
                    <span className='text-sm'>@{u.handle}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <Search />
    </Suspense>
  )
}
