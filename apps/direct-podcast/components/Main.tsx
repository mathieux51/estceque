import React from 'react'
import styled from 'styled-components'
import { saveAs } from 'file-saver'
import Mic from './Mic'
import MicOff from './MicOff'
import Timer from './Timer'
import Footer from './Footer'
import Header from './Header'
import filename from '../helpers/filename'
import { toError } from '../helpers/errors'
import packageJSON from '../package.json'
import { saveSharedAudioFile } from '../lib/sharedDB'
import {
  saveLocalRecording,
  getLatestLocalRecording,
  cleanupOldLocalRecordings,
} from '../lib/recordingDB'
import {
  createRecordingSession,
  saveRecordingChunk,
  markSessionComplete,
  cleanupOldSessions,
} from '../lib/chunkedRecordingDB'

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  background: ${(props) => props.theme.blue};
  flex-direction: column;
  display: flex;
`
const Button = styled.button`
  width: 12rem;
  height: 12rem;
  cursor: pointer;
`

const StyledHeader = styled(Header)`
  height: 70px;
  padding-top: 1rem;
  padding-right: 1rem;
`

const Form = styled.form`
  height: auto;
  margin: auto 0;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`

const StyledFooter = styled(Footer)`
  height: 92px;
  padding-bottom: 1rem;
`

const StyledMic = styled(Mic)``

const StyledMicOff = styled(MicOff)`
  & path {
    fill: ${(props) => props.theme.grey};
  }
`

const ConversionIndicator = styled.div`
  color: ${(props) => props.theme.grey};
  font-size: 16px;
  margin-top: 0.5rem;
  text-align: center;
`

const ShareButton = styled.a`
  background-color: ${(props) => props.theme.black};
  color: ${(props) => props.theme.grey};
  border: 2px solid ${(props) => props.theme.grey};
  padding: 0.75rem 1.5rem;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  margin-top: 1rem;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;

  &:hover {
    background-color: ${(props) => props.theme.white};
    color: ${(props) => props.theme.blue};
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`
const handleStream = async ({
  setError,
  setStream,
}: {
  setError: React.Dispatch<React.SetStateAction<Error | undefined>>
  setStream: React.Dispatch<React.SetStateAction<MediaStream | undefined>>
}): Promise<MediaStream | undefined> => {
  try {
    const userMediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    })
    setStream(userMediaStream)
    return userMediaStream
  } catch (error) {
    setError(toError(error))
  }
}

const handleStopRecording = async ({
  useMp3,
  recorder,
  setRecorder,
  setError,
  setIsConverting,
  setLastRecording,
  currentSessionIdRef,
  recordedChunksRef,
}: {
  useMp3: boolean
  recorder: MediaRecorder
  setError: React.Dispatch<React.SetStateAction<Error | undefined>>
  setRecorder: React.Dispatch<React.SetStateAction<MediaRecorder | undefined>>
  setIsConverting: React.Dispatch<React.SetStateAction<boolean>>
  setLastRecording: React.Dispatch<
    React.SetStateAction<{ blob: Blob; filename: string } | null>
  >
  currentSessionIdRef: React.MutableRefObject<string | null>
  recordedChunksRef: React.MutableRefObject<Blob[]>
}) => {
  return new Promise<void>((resolve) => {
    recorder.onstop = async () => {
      try {
        // Combine all recorded chunks
        const blob = new Blob(recordedChunksRef.current, {
          type: recordedChunksRef.current[0]?.type || 'audio/webm',
        })

        // Always convert to WAV first (or MP3 if requested)
        setIsConverting(true)

        let ffmpeg: import('@ffmpeg/ffmpeg').FFmpeg | null = null
        try {
          const { FFmpeg } = await import('@ffmpeg/ffmpeg')
          const { toBlobURL } = await import('@ffmpeg/util')
          ffmpeg = new FFmpeg()
          const version = packageJSON.devDependencies['@ffmpeg/core'].replace(
            '^',
            ''
          )
          const baseURL = `https://unpkg.com/@ffmpeg/core@${version}/dist/umd`

          await ffmpeg.load({
            coreURL: await toBlobURL(
              `${baseURL}/ffmpeg-core.js`,
              'text/javascript'
            ),
            wasmURL: await toBlobURL(
              `${baseURL}/ffmpeg-core.wasm`,
              'application/wasm'
            ),
          })

          const fName = filename()
          const inputExt = blob.type.includes('wav')
            ? 'wav'
            : blob.type.includes('webm')
              ? 'webm'
              : 'mp4'
          const input = `${fName}.${inputExt}`
          const arrayBuffer = await blob.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)

          await ffmpeg.writeFile(input, uint8Array)

          if (useMp3) {
            // Convert to MP3
            const mp3 = `${fName}.mp3`
            await ffmpeg.exec(['-i', input, mp3])
            const file = await ffmpeg.readFile(mp3)
            const mp3Blob = new Blob([file])
            saveAs(mp3Blob, mp3)
            setLastRecording({ blob: mp3Blob, filename: mp3 })

            // Save to IndexedDB for data persistence
            const mp3ArrayBuffer = await mp3Blob.arrayBuffer()
            await saveLocalRecording(mp3, 'audio/mpeg', mp3ArrayBuffer, true)

            // Mark session as complete
            if (currentSessionIdRef.current) {
              await markSessionComplete(currentSessionIdRef.current, mp3)
              currentSessionIdRef.current = null
            }

            // Cleanup temporary files
            try {
              await ffmpeg.deleteFile(input)
              await ffmpeg.deleteFile(mp3)
            } catch (cleanupError) {
              // Ignore cleanup errors, they're not critical
            }
          } else {
            // Convert to WAV
            const wav = `${fName}.wav`
            await ffmpeg.exec(['-i', input, wav])
            const file = await ffmpeg.readFile(wav)
            const wavBlob = new Blob([file])
            saveAs(wavBlob, wav)
            setLastRecording({ blob: wavBlob, filename: wav })

            // Save to IndexedDB for data persistence
            const wavArrayBuffer = await wavBlob.arrayBuffer()
            await saveLocalRecording(wav, 'audio/wav', wavArrayBuffer, false)

            // Mark session as complete
            if (currentSessionIdRef.current) {
              await markSessionComplete(currentSessionIdRef.current, wav)
              currentSessionIdRef.current = null
            }

            // Cleanup temporary files
            try {
              await ffmpeg.deleteFile(input)
              await ffmpeg.deleteFile(wav)
            } catch (cleanupError) {
              // Ignore cleanup errors, they're not critical
            }
          }
        } catch (conversionError) {
          const error = toError(conversionError)
          if (
            error.message?.includes('network') ||
            error.message?.includes('fetch')
          ) {
            setError(
              new Error(
                'Network error: Unable to load converter. Please check your internet connection.'
              )
            )
          } else if (
            error.message?.includes('WASM') ||
            error.message?.includes('WebAssembly')
          ) {
            setError(
              new Error(
                'Browser compatibility error: Your browser may not support audio conversion.'
              )
            )
          } else {
            setError(new Error(`Audio conversion failed: ${error.message}`))
          }
        } finally {
          setIsConverting(false)
        }

        setRecorder(undefined)
        resolve()
      } catch (error) {
        if (!useMp3) {
          setError(toError(error))
        }
        resolve()
      }
    }

    recorder.stop()
  })
}

const handleRecorder = async ({
  recorder,
  setRecorder,
  setError,
  stream,
  createMediaRecorder,
}: {
  recorder: MediaRecorder | undefined
  setRecorder: React.Dispatch<React.SetStateAction<MediaRecorder | undefined>>
  setError: React.Dispatch<React.SetStateAction<Error | undefined>>
  stream: MediaStream | undefined
  createMediaRecorder: (stream: MediaStream) => MediaRecorder
}): Promise<MediaRecorder | undefined> => {
  try {
    if (typeof stream !== 'undefined' && typeof recorder === 'undefined') {
      const nextRecorder = createMediaRecorder(stream)
      setRecorder(nextRecorder)
      return nextRecorder
    }
  } catch (error) {
    setError(toError(error))
  }
}

const handleRecord = async ({
  isRecording,
  recorder,
  setError,
  setIsRecording,
  setRecorder,
  stream,
  useMp3,
  setIsConverting,
  setLastRecording,
  currentSessionIdRef,
  chunkIndexRef,
  recordedChunksRef,
}: {
  stream: MediaStream | undefined
  isRecording: boolean
  recorder: MediaRecorder | undefined
  setError: React.Dispatch<React.SetStateAction<Error | undefined>>
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>
  setRecorder: React.Dispatch<React.SetStateAction<MediaRecorder | undefined>>
  useMp3: boolean
  setIsConverting: React.Dispatch<React.SetStateAction<boolean>>
  setLastRecording: React.Dispatch<
    React.SetStateAction<{ blob: Blob; filename: string } | null>
  >
  currentSessionIdRef: React.MutableRefObject<string | null>
  chunkIndexRef: React.MutableRefObject<number>
  recordedChunksRef: React.MutableRefObject<Blob[]>
}) => {
  try {
    if (!isRecording && typeof recorder !== 'undefined' && stream?.active) {
      setIsRecording(true)
      // Create a new recording session
      const sessionId = await createRecordingSession('audio/webm')
      currentSessionIdRef.current = sessionId
      chunkIndexRef.current = 0

      // Start recording with 5-second intervals for chunks
      recorder.start(5000)
      return
    }

    setIsRecording(false)

    if (typeof recorder !== 'undefined') {
      await handleStopRecording({
        recorder,
        setRecorder,
        setError,
        useMp3,
        setIsConverting,
        setLastRecording,
        currentSessionIdRef,
        recordedChunksRef,
      })
    }
  } catch (error) {
    setError(toError(error))
  }
}

function Main() {
  const [isRecording, setIsRecording] = React.useState(false)
  const [recorder, setRecorder] = React.useState<MediaRecorder>()
  const [stream, setStream] = React.useState<MediaStream>()
  const [error, setError] = React.useState<Error>()
  const [useMp3, setUseMp3] = React.useState<boolean>(false) // either 'audio/wav' or 'audio/mpeg' (MP3)
  const [volumeLevel, setVolumeLevel] = React.useState<number>(0)
  const [isConverting, setIsConverting] = React.useState<boolean>(false)
  const [lastRecording, setLastRecording] = React.useState<{
    blob: Blob
    filename: string
  } | null>(null)
  const currentSessionIdRef = React.useRef<string | null>(null)
  const chunkIndexRef = React.useRef(0)
  const animationFrameRef = React.useRef<number>()
  const audioContextRef = React.useRef<AudioContext>()
  const analyserRef = React.useRef<AnalyserNode>()
  const dataArrayRef = React.useRef<Uint8Array>()
  const recordedChunksRef = React.useRef<Blob[]>([])

  const createMediaRecorder = (stream: MediaStream): MediaRecorder => {
    // MediaRecorder doesn't support audio/wav in most browsers
    // Use webm/opus which has excellent support and quality
    let mimeType = 'audio/webm;codecs=opus'
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''
        }
      }
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
    })

    recordedChunksRef.current = []

    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        // Store chunk for final recording
        recordedChunksRef.current.push(event.data)

        // Also save to IndexedDB for crash recovery
        if (currentSessionIdRef.current) {
          try {
            const arrayBuffer = await event.data.arrayBuffer()
            await saveRecordingChunk(
              currentSessionIdRef.current,
              chunkIndexRef.current,
              arrayBuffer
            )
            chunkIndexRef.current += 1
          } catch (error) {
            // Error saving chunk - continue silently
          }
        }
      }
    }

    return mediaRecorder
  }

  // Recover last recording from IndexedDB on page load
  React.useEffect(() => {
    const loadLastRecording = async () => {
      try {
        // Clean up old sessions and recordings
        await cleanupOldLocalRecordings()
        await cleanupOldSessions()

        // Note: Incomplete sessions are left as-is for manual recovery via recovery page

        // If no incomplete sessions, load the latest complete recording
        const lastSavedRecording = await getLatestLocalRecording()
        if (lastSavedRecording) {
          const blob = new Blob([lastSavedRecording.arrayBuffer], {
            type: lastSavedRecording.fileType,
          })
          setLastRecording({
            blob,
            filename: lastSavedRecording.filename,
          })
          // Set MP3 mode if the recovered recording was converted
          if (lastSavedRecording.isConverted) {
            setUseMp3(true)
          }
        }
      } catch (error) {
        // Error loading last recording - silently continue
      }
    }

    loadLastRecording()
  }, [])

  // Setup audio level monitoring
  React.useEffect(() => {
    let cleanup = false

    if (stream && isRecording) {
      try {
        // Close existing audio context if any
        if (
          audioContextRef.current &&
          audioContextRef.current.state !== 'closed'
        ) {
          audioContextRef.current.close()
          audioContextRef.current = undefined
        }

        // Create audio context and analyser
        const audioContext = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)()
        audioContextRef.current = audioContext

        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.3
        analyserRef.current = analyser

        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        const bufferLength = analyser.fftSize
        const dataArray = new Uint8Array(bufferLength)
        dataArrayRef.current = dataArray

        // Animation loop to update volume level
        const updateVolume = () => {
          if (cleanup || !analyserRef.current || !dataArrayRef.current) return

          analyserRef.current.getByteTimeDomainData(dataArrayRef.current)

          // Calculate RMS (Root Mean Square) for better volume representation
          let sum = 0
          for (let i = 0; i < bufferLength; i++) {
            const amplitude = (dataArrayRef.current[i] - 128) / 128
            sum += amplitude * amplitude
          }
          const rms = Math.sqrt(sum / bufferLength)
          // Scale and clamp the volume (RMS is typically quite low, so we multiply)
          const scaledVolume = Math.min(1, rms * 8)

          setVolumeLevel(scaledVolume)

          if (isRecording && !cleanup) {
            animationFrameRef.current = requestAnimationFrame(updateVolume)
          }
        }

        updateVolume()
      } catch (err) {
        // Ignore audio setup errors, not critical for recording
      }
    } else {
      // Cleanup when not recording
      setVolumeLevel(0)
    }

    return () => {
      cleanup = true
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== 'closed'
      ) {
        audioContextRef.current.close().catch(() => {
          // Ignore errors when closing
        })
        audioContextRef.current = undefined
      }
    }
  }, [stream, isRecording])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    event.stopPropagation()

    // set stream the first time the user clicks or record button
    if (typeof stream === 'undefined') {
      const nextStream = await handleStream({ setStream, setError })
      const nextRecorder = await handleRecorder({
        recorder,
        setError,
        setRecorder,
        stream: nextStream,
        createMediaRecorder,
      })
      handleRecord({
        isRecording,
        recorder: nextRecorder,
        setError,
        setIsRecording,
        setRecorder,
        stream: nextStream,
        useMp3,
        setIsConverting,
        setLastRecording,
        currentSessionIdRef,
        chunkIndexRef,
        recordedChunksRef,
      })
      return
    }
    if (typeof recorder === 'undefined') {
      const nextRecorder = await handleRecorder({
        recorder,
        setError,
        setRecorder,
        stream,
        createMediaRecorder,
      })
      handleRecord({
        isRecording,
        recorder: nextRecorder,
        setError,
        setIsRecording,
        setRecorder,
        stream,
        useMp3,
        setIsConverting,
        setLastRecording,
        currentSessionIdRef,
        chunkIndexRef,
        recordedChunksRef,
      })
      return
    }

    handleRecord({
      isRecording,
      recorder,
      setError,
      setIsRecording,
      setRecorder,
      stream,
      useMp3,
      setIsConverting,
      setLastRecording,
      currentSessionIdRef,
      chunkIndexRef,
      recordedChunksRef,
    })
  }
  const handleChange = () => setUseMp3((prevUseMp3) => !prevUseMp3)

  const [isPreparingShare, setIsPreparingShare] = React.useState(false)

  const handleShareToMontage = async (
    e: React.MouseEvent<HTMLAnchorElement>
  ) => {
    if (!lastRecording) {
      e.preventDefault()
      return
    }

    if (isPreparingShare) {
      e.preventDefault()
      alert('Préparation du partage en cours, veuillez patienter...')
      return
    }

    e.preventDefault()
    setIsPreparingShare(true)

    try {
      // Save audio data to shared IndexedDB
      const arrayBuffer = await lastRecording.blob.arrayBuffer()
      await saveSharedAudioFile(
        lastRecording.filename,
        lastRecording.blob.type,
        arrayBuffer
      )

      // Navigate to montage app
      window.location.href = '/montage?sharing=true'
    } catch (error) {
      alert('Erreur lors de la préparation du partage. Veuillez réessayer.')
    } finally {
      setIsPreparingShare(false)
    }
  }

  if (error) {
    throw error
  }

  return (
    <Container>
      <StyledHeader onChange={handleChange} />
      <Form onSubmit={handleSubmit}>
        <Button type='submit' aria-label='enregistrer'>
          {isRecording ? (
            <StyledMic volumeLevel={volumeLevel} />
          ) : (
            <StyledMicOff />
          )}
        </Button>
        <Timer isRecording={isRecording} />
        {isConverting && (
          <ConversionIndicator>
            {useMp3 ? 'Conversion en MP3...' : 'Conversion en WAV...'}
          </ConversionIndicator>
        )}
        {lastRecording && !isRecording && !isConverting && (
          <ShareButton
            href='#'
            onClick={handleShareToMontage}
            className={isPreparingShare ? 'disabled' : ''}
          >
            {isPreparingShare
              ? 'Préparation...'
              : 'Partager vers Direct Montage'}
          </ShareButton>
        )}
      </Form>
      <StyledFooter />
    </Container>
  )
}

export default Main
