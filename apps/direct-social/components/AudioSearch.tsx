'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { api, ApiError } from '@/lib/api'
import { formatTime } from '@/lib/format'
import { usePlayer } from '@/lib/player'
import { extensionFor, useRecorder } from '@/lib/recorder'
import type { AudioMatch } from '@/lib/types'
import Cover from './Cover'
import { MicIcon, PlayIcon } from './Icons'
import { ErrorMessage } from './States'

// Listening goes on for at most this long; a clear match usually comes after
// 3 or 4 seconds.
const LISTEN_SECONDS = 15
const MIN_SECONDS = 3

type Result = { match: AudioMatch | null }

// AudioSearch listens to a podcast playing nearby and finds the episode and
// the moment it is at. The recording so far is sent every 2 seconds, and
// listening stops at the first match.
export default function AudioSearch({ autoStart = false }: { autoStart?: boolean }) {
  const player = usePlayer()
  const [state, setState] = useState<'idle' | 'searching' | 'found' | 'none'>('idle')
  const [match, setMatch] = useState<AudioMatch | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [foundIn, setFoundIn] = useState(0)
  // When the recording that matched ended: the podcast kept playing since.
  const matchedAt = useRef(0)
  const found = useRef(false)
  const asking = useRef(false)
  const stopListening = useRef(() => {})
  const started = useRef(false)

  const ask = async (blob: Blob, seconds: number, final: boolean) => {
    const endedAt = performance.now()
    const form = new FormData()
    form.append('audio', blob, `extrait.${extensionFor(blob)}`)
    asking.current = true
    try {
      const result = await api<Result>('/search/audio', { method: 'POST', body: form })
      if (found.current) return
      if (result.match) {
        found.current = true
        matchedAt.current = endedAt
        setMatch(result.match)
        setFoundIn(seconds)
        setState('found')
        stopListening.current()
      } else if (final) {
        setState('none')
      }
    } catch (err) {
      // Answers to partial recordings can be ignored; the last one cannot.
      if (final) {
        setState('idle')
        setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.')
      }
    } finally {
      asking.current = false
    }
  }

  const recorder = useRecorder({
    maxSeconds: LISTEN_SECONDS,
    raw: true,
    progressEvery: 2,
    onProgress: (blob, seconds) => {
      // One question at a time: skip this round if the last one is still out.
      if (seconds >= MIN_SECONDS && !asking.current && !found.current) ask(blob, seconds, false)
    },
    onDone: (blob, seconds) => {
      if (found.current) return
      if (seconds < MIN_SECONDS) {
        setState('idle')
        setError(`Écoutez au moins ${MIN_SECONDS} secondes.`)
        return
      }
      setState('searching')
      ask(blob, seconds, true)
    },
  })
  stopListening.current = recorder.stop

  const now = () => (match ? match.atSeconds + (performance.now() - matchedAt.current) / 1000 : 0)

  const listen = () => {
    setError(null)
    setMatch(null)
    setState('idle')
    found.current = false
    if (player.playing) player.toggle()
    recorder.start()
  }
  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true
      listen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

  return (
    <section className='card space-y-3' data-testid='audio-search'>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='mr-auto'>
          <h2 className='title text-xl'>Reconnaître un podcast</h2>
          <p className='text-sm'>Approchez votre téléphone ou ordinateur du son : on trouve l’épisode et le moment.</p>
        </div>
        {recorder.recording ? (
          <button className='btn-danger' onClick={recorder.stop} disabled={recorder.seconds < 3}>
            Arrêter ({Math.ceil(LISTEN_SECONDS - recorder.seconds)} s)
          </button>
        ) : (
          <button className='btn-primary' onClick={listen} disabled={state === 'searching'}>
            <MicIcon /> {state === 'searching' ? 'Recherche…' : 'Écouter'}
          </button>
        )}
      </div>
      {recorder.recording && (
        <div className='flex items-center gap-3' role='status'>
          <span className='relative flex h-3 w-3'>
            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75' />
            <span className='relative inline-flex h-3 w-3 rounded-full bg-danger' />
          </span>
          <span>J’écoute…</span>
          <div className='h-2 flex-1 overflow-hidden rounded bg-deep'>
            <div className='h-full bg-success transition-[width]' style={{ width: `${Math.min(100, recorder.level * 140)}%` }} />
          </div>
        </div>
      )}
      {(recorder.error || error) && <ErrorMessage message={recorder.error ?? error!} />}
      {state === 'none' && (
        <p role='status'>Aucun épisode reconnu. Rapprochez-vous du son et réessayez.</p>
      )}
      {state === 'found' && match && (
        <div className='flex items-center gap-3 rounded-lg bg-deep p-3' data-testid='audio-match'>
          <Cover url={match.episode.show.coverUrl} title={match.episode.show.title} className='h-14 w-14' />
          <div className='min-w-0 flex-1'>
            <Link href={`/episodes/${match.episode.id}?t=${Math.floor(match.atSeconds)}`} className='font-medium text-white hover:underline'>
              {match.episode.title}
            </Link>
            <p className='truncate text-sm'>{match.episode.show.title}</p>
            <p className='text-sm text-warning' data-testid='audio-match-time'>
              Vous en êtes à {formatTime(match.atSeconds)}
              <span className='ml-2 text-xs text-grey'>· reconnu en {Math.round(foundIn)} s</span>
            </p>
          </div>
          <button className='btn-primary' onClick={() => player.play(match.episode, now())}>
            <PlayIcon /> Continuer ici
          </button>
        </div>
      )}
    </section>
  )
}
