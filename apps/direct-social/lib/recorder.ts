'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Options = {
  maxSeconds: number
  // Raw sound, without the voice processing of calls: needed to recognise music
  // and podcasts played by a speaker.
  raw?: boolean
  onDone?: (blob: Blob, seconds: number) => void
  // Called every `progressEvery` seconds with everything recorded so far. The
  // whole recording is sent, not the last piece: later pieces of a WebM file
  // cannot be decoded without the header at its start.
  onProgress?: (blob: Blob, seconds: number) => void
  progressEvery?: number
}

// useRecorder records the microphone with MediaRecorder.
export function useRecorder({ maxSeconds, raw = false, onDone, onProgress, progressEvery = 2 }: Options) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [level, setLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const stopRef = useRef<() => void>(() => {})
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const progressRef = useRef(onProgress)
  progressRef.current = onProgress

  const start = useCallback(async () => {
    setError(null)
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: raw ? { echoCancellation: false, noiseSuppression: false, autoGainControl: false } : true,
      })
    } catch {
      setError("Impossible d'accéder au micro. Autorisez-le dans votre navigateur.")
      return
    }
    const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((t) =>
      MediaRecorder.isTypeSupported(t),
    )
    const recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined)
    const chunks: Blob[] = []
    const context = new AudioContext()
    const analyser = context.createAnalyser()
    analyser.fftSize = 512
    context.createMediaStreamSource(stream).connect(analyser)
    const buffer = new Uint8Array(analyser.fftSize)
    const began = performance.now()
    let frame = 0
    const tick = () => {
      analyser.getByteTimeDomainData(buffer)
      let peak = 0
      for (const v of buffer) peak = Math.max(peak, Math.abs(v - 128) / 128)
      setLevel(peak)
      const elapsed = (performance.now() - began) / 1000
      setSeconds(elapsed)
      if (elapsed >= maxSeconds) stop()
      else frame = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      if (recorder.state !== 'inactive') recorder.stop()
    }
    let lastProgress = 0
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data)
      const elapsed = (performance.now() - began) / 1000
      if (progressRef.current && recorder.state === 'recording' && elapsed - lastProgress >= progressEvery) {
        lastProgress = elapsed
        progressRef.current(new Blob(chunks, { type: recorder.mimeType }), elapsed)
      }
    }
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop())
      context.close()
      setRecording(false)
      setLevel(0)
      const elapsed = (performance.now() - began) / 1000
      doneRef.current?.(new Blob(chunks, { type: recorder.mimeType }), elapsed)
    }
    stopRef.current = stop
    recorder.start(250)
    setRecording(true)
    setSeconds(0)
    frame = requestAnimationFrame(tick)
  }, [maxSeconds, raw, progressEvery])

  const stop = useCallback(() => stopRef.current(), [])
  useEffect(() => () => stopRef.current(), [])

  return { start, stop, recording, seconds, level, error }
}

export function extensionFor(blob: Blob): string {
  if (blob.type.includes('mp4')) return 'm4a'
  if (blob.type.includes('ogg')) return 'ogg'
  return 'webm'
}
