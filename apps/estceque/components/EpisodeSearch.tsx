'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AUDIENCES, type Audience } from '@/lib/projects'
import { normalize } from '@/lib/normalize'
import AushaPlayer from './AushaPlayer'

export interface SearchItem {
  id: string
  slug: string
  title: string
  project: string
  projectSlug: string
  audience: Audience
  place: string
  year: string
  date: string
  duration: string
  image: string | null
  /** Title, project, place and description, lower case and without accents. */
  text: string
}

type Filters = { q: string; public: string; projet: string; annee: string }
const EMPTY: Filters = { q: '', public: '', projet: '', annee: '' }

function readFilters(): Filters {
  const params = new URLSearchParams(window.location.search)
  return {
    q: params.get('q') ?? '',
    public: params.get('public') ?? '',
    projet: params.get('projet') ?? '',
    annee: params.get('annee') ?? '',
  }
}

/** Search over every episode, with filters kept in the address for sharing. */
export default function EpisodeSearch({
  items,
  projects,
  limit,
}: {
  items: SearchItem[]
  projects: { slug: string; title: string }[]
  /** Show at most this many results (used on the home page). */
  limit?: number
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    if (!limit) setFilters(readFilters())
  }, [limit])

  useEffect(() => {
    if (limit) return
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filters))
      if (value) params.set(key, value)
    const query = params.toString()
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}`
    )
  }, [filters, limit])

  const years = useMemo(
    () => [...new Set(items.map((item) => item.year))],
    [items]
  )
  const results = useMemo(() => {
    const words = normalize(filters.q).split(/\s+/).filter(Boolean)
    return items.filter(
      (item) =>
        (!filters.public || item.audience === filters.public) &&
        (!filters.projet || item.projectSlug === filters.projet) &&
        (!filters.annee || item.year === filters.annee) &&
        words.every((word) => item.text.includes(word))
    )
  }, [items, filters])
  const shown = limit ? results.slice(0, limit) : results
  const set = (key: keyof Filters, value: string) =>
    setFilters((current) => ({
      ...current,
      [key]: current[key] === value ? '' : value,
    }))
  const active = Object.values(filters).some(Boolean)

  return (
    <div className='space-y-4'>
      <form
        role='search'
        className='flex flex-col gap-3'
        onSubmit={(event) => {
          event.preventDefault()
          if (limit) {
            window.location.href = `/podcasts/?q=${encodeURIComponent(filters.q)}`
          }
        }}
      >
        <label htmlFor='episode-search' className='sr-only'>
          Rechercher un podcast
        </label>
        <input
          id='episode-search'
          type='search'
          value={filters.q}
          onChange={(event) =>
            setFilters((current) => ({ ...current, q: event.target.value }))
          }
          placeholder='Un titre, un établissement, une ville, un thème…'
          className='w-full rounded-lg border border-grey/50 bg-deep px-4 py-3 text-white outline-none placeholder:text-grey/60 focus:border-white'
        />
        <div className='flex flex-wrap gap-2' role='group' aria-label='Public'>
          {(Object.keys(AUDIENCES) as Audience[]).map((audience) => (
            <button
              key={audience}
              type='button'
              aria-pressed={filters.public === audience}
              onClick={() => set('public', audience)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                filters.public === audience
                  ? 'border-white bg-white text-brand'
                  : 'border-grey/50 hover:border-white hover:text-white'
              }`}
            >
              {AUDIENCES[audience]}
            </button>
          ))}
        </div>
        {!limit && (
          <div className='flex flex-wrap gap-2'>
            <select
              aria-label='Projet'
              value={filters.projet}
              onChange={(event) =>
                setFilters((c) => ({ ...c, projet: event.target.value }))
              }
              className='rounded-lg border border-grey/50 bg-deep px-3 py-2 text-sm text-white'
            >
              <option value=''>Tous les projets</option>
              {projects.map((project) => (
                <option key={project.slug} value={project.slug}>
                  {project.title}
                </option>
              ))}
            </select>
            <select
              aria-label='Année'
              value={filters.annee}
              onChange={(event) =>
                setFilters((c) => ({ ...c, annee: event.target.value }))
              }
              className='rounded-lg border border-grey/50 bg-deep px-3 py-2 text-sm text-white'
            >
              <option value=''>Toutes les années</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {active && (
              <button
                type='button'
                className='btn'
                onClick={() => setFilters(EMPTY)}
              >
                Effacer les filtres
              </button>
            )}
          </div>
        )}
      </form>

      <p className='text-sm' aria-live='polite'>
        {results.length === items.length
          ? `${items.length} épisodes`
          : `${results.length} épisode${results.length > 1 ? 's' : ''} sur ${items.length}`}
      </p>

      <ul className='space-y-2'>
        {shown.map((item) => (
          <li
            key={item.id}
            className='rounded-lg border border-grey/30 bg-white/5'
          >
            <div className='flex items-center gap-3 p-3'>
              {item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt=''
                  width={56}
                  height={56}
                  loading='lazy'
                  className='h-14 w-14 shrink-0 rounded-md object-cover'
                />
              )}
              <div className='min-w-0 flex-1'>
                <Link
                  href={`/podcasts/${item.slug}/`}
                  className='block leading-snug text-white hover:underline'
                >
                  {item.title}
                </Link>
                <p className='text-xs'>
                  {item.project} · {item.place} · {item.date}
                  {item.duration && ` · ${item.duration}`}
                </p>
              </div>
              <button
                type='button'
                className='btn shrink-0 px-3'
                aria-expanded={open === item.id}
                onClick={() => setOpen(open === item.id ? null : item.id)}
              >
                {open === item.id ? 'Fermer' : 'Écouter'}
              </button>
            </div>
            {open === item.id && (
              <div className='px-3 pb-3'>
                <AushaPlayer
                  kind='episode'
                  id={item.id}
                  title={item.title}
                  autoLoad
                />
              </div>
            )}
          </li>
        ))}
      </ul>
      {limit && results.length > limit && (
        <Link
          className='btn-primary'
          href={`/podcasts/${filters.q || filters.public ? `?${new URLSearchParams(Object.entries({ q: filters.q, public: filters.public }).filter(([, v]) => v)).toString()}` : ''}`}
        >
          Voir les {results.length} résultats
        </Link>
      )}
    </div>
  )
}
