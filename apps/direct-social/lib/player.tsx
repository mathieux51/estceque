'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { api } from './api'
import { useSession } from './session'
import type { Episode } from './types'

type Player = {
  episode: Episode | null
  playing: boolean
  time: number
  duration: number
  rate: number
  // Plays an episode, from `at` seconds or from where the listener stopped.
  play: (episode: Episode, at?: number) => void
  toggle: () => void
  seek: (seconds: number) => void
  setRate: (rate: number) => void
}

const PlayerContext = createContext<Player | null>(null)

const SAVE_EVERY_SECONDS = 10

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null)
  const { me } = useSession()
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rate, setRateState] = useState(1)
  const lastSave = useRef(0)
  const counted = useRef<number | null>(null)

  const saveProgress = useCallback(
    (completed = false) => {
      const el = audio.current
      if (!me || !episode || !el) return
      lastSave.current = el.currentTime
      api(`/episodes/${episode.id}/progress`, {
        method: 'PUT',
        json: { positionSeconds: el.currentTime, completed },
      }).catch(() => {})
    },
    [me, episode],
  )

  const play = useCallback((next: Episode, at?: number) => {
    const el = audio.current
    if (!el || !next.audioUrl) return
    setEpisode((current) => {
      if (current?.id !== next.id) {
        el.src = next.audioUrl!
        el.playbackRate = el.playbackRate || 1
      }
      return next
    })
    const start = at ?? (next.progressSeconds && next.durationSeconds && next.progressSeconds < next.durationSeconds - 5 ? next.progressSeconds : undefined)
    const begin = () => {
      if (start !== undefined) el.currentTime = start
      el.play().catch(() => {})
    }
    if (el.readyState >= 1 && el.src.endsWith(next.audioUrl)) begin()
    else el.addEventListener('loadedmetadata', begin, { once: true })
    if (counted.current !== next.id) {
      counted.current = next.id
      api(`/episodes/${next.id}/play`, { method: 'POST' }).catch(() => {})
    }
  }, [])

  const toggle = useCallback(() => {
    const el = audio.current
    if (!el || !el.src) return
    if (el.paused) el.play().catch(() => {})
    else el.pause()
  }, [])

  const seek = useCallback((seconds: number) => {
    const el = audio.current
    if (el) el.currentTime = Math.max(0, Math.min(seconds, el.duration || seconds))
  }, [])

  const setRate = useCallback((value: number) => {
    if (audio.current) audio.current.playbackRate = value
    setRateState(value)
  }, [])

  useEffect(() => {
    const el = audio.current
    if (!el) return
    const onTime = () => {
      setTime(el.currentTime)
      if (Math.abs(el.currentTime - lastSave.current) >= SAVE_EVERY_SECONDS) saveProgress()
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => {
      setPlaying(false)
      saveProgress()
    }
    const onEnded = () => saveProgress(true)
    const onMeta = () => setDuration(el.duration)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnded)
    el.addEventListener('loadedmetadata', onMeta)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('loadedmetadata', onMeta)
    }
  }, [saveProgress])

  return (
    <PlayerContext.Provider value={{ episode, playing, time, duration, rate, play, toggle, seek, setRate }}>
      {children}
      <audio ref={audio} preload='metadata' data-testid='player-audio' />
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const player = useContext(PlayerContext)
  if (!player) throw new Error('usePlayer outside PlayerProvider')
  return player
}
