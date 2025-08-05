import React from 'react'
import styled from 'styled-components'
import { saveAs } from 'file-saver'
import Mic from './Mic'
import MicOff from './MicOff'
import Timer from './Timer'
import Footer from './Footer'
import Header from './Header'
import filename from '../helpers/filename'
import type RecordRTC from 'recordrtc'
import { toError } from '../helpers/errors'
import packageJSON from '../package.json'

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
}: {
  useMp3: boolean
  recorder: RecordRTC
  setError: React.Dispatch<React.SetStateAction<Error | undefined>>
  setRecorder: React.Dispatch<React.SetStateAction<RecordRTC | undefined>>
  setIsConverting: React.Dispatch<React.SetStateAction<boolean>>
  setLastRecording: React.Dispatch<
    React.SetStateAction<{ blob: Blob; filename: string } | null>
  >
}) => {
  try {
    const blob = recorder.getBlob()
    if (useMp3) {
      setIsConverting(true)

      let ffmpeg: import('@ffmpeg/ffmpeg').FFmpeg | null = null
      try {
        const { FFmpeg } = await import('@ffmpeg/ffmpeg')
        const { toBlobURL } = await import('@ffmpeg/util')
        ffmpeg = new FFmpeg()
        const version = packageJSON.devDependencies['@ffmpeg/core'].replace(
          '^',
          '',
        )
        const baseURL = `https://unpkg.com/@ffmpeg/core@${version}/dist/umd`

        await ffmpeg.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            'text/javascript',
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            'application/wasm',
          ),
        })

        const fName = filename()
        const wav = `${fName}.wav`
        const mp3 = `${fName}.mp3`
        const arrayBuffer = await blob.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        await ffmpeg.writeFile(wav, uint8Array)
        await ffmpeg.exec(['-i', wav, mp3])
        const file = await ffmpeg.readFile(mp3)
        const mp3Blob = new Blob([file])
        saveAs(mp3Blob, mp3)
        setLastRecording({ blob: mp3Blob, filename: mp3 })

        // Cleanup temporary files
        try {
          await ffmpeg.deleteFile(wav)
          await ffmpeg.deleteFile(mp3)
        } catch (cleanupError) {
          // Ignore cleanup errors, they're not critical
          console.warn('Failed to cleanup temporary files:', cleanupError)
        }
      } catch (conversionError) {
        const error = toError(conversionError)
        if (
          error.message?.includes('network') ||
          error.message?.includes('fetch')
        ) {
          setError(
            new Error(
              'Network error: Unable to load MP3 converter. Please check your internet connection.',
            ),
          )
        } else if (
          error.message?.includes('WASM') ||
          error.message?.includes('WebAssembly')
        ) {
          setError(
            new Error(
              'Browser compatibility error: Your browser may not support MP3 conversion.',
            ),
          )
        } else {
          setError(new Error(`MP3 conversion failed: ${error.message}`))
        }
        throw error
      } finally {
        setIsConverting(false)
      }
    } else {
      const wavFilename = `${filename()}.wav`
      saveAs(blob, wavFilename)
      setLastRecording({ blob, filename: wavFilename })
    }
    recorder.destroy()
    setRecorder(undefined)
  } catch (error) {
    if (!useMp3) {
      setError(toError(error))
    }
    // MP3 errors are already handled above
  }
}

const handleRecorder = async ({
  recorder,
  setRecorder,
  setError,
  stream,
}: {
  recorder: RecordRTC | undefined
  setRecorder: React.Dispatch<React.SetStateAction<RecordRTC | undefined>>
  setError: React.Dispatch<React.SetStateAction<Error | undefined>>
  stream: MediaStream | undefined
}): Promise<RecordRTC | undefined> => {
  try {
    if (typeof stream !== 'undefined' && typeof recorder === 'undefined') {
      const RecordRTC = (await import('recordrtc')).default
      const nextRecorder = new RecordRTC(stream.clone(), {
        recorderType: RecordRTC.StereoAudioRecorder,
        mimeType: 'audio/wav',
        disableLogs: true,
      })
      setRecorder(nextRecorder)
      return nextRecorder
    }
  } catch (error) {
    setError(toError(error))
  }
}

const handleRecord = ({
  isRecording,
  recorder,
  setError,
  setIsRecording,
  setRecorder,
  stream,
  useMp3,
  setIsConverting,
  setLastRecording,
}: {
  stream: MediaStream | undefined
  isRecording: boolean
  recorder: RecordRTC | undefined
  setError: React.Dispatch<React.SetStateAction<Error | undefined>>
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>
  setRecorder: React.Dispatch<React.SetStateAction<RecordRTC | undefined>>
  useMp3: boolean
  setIsConverting: React.Dispatch<React.SetStateAction<boolean>>
  setLastRecording: React.Dispatch<
    React.SetStateAction<{ blob: Blob; filename: string } | null>
  >
}) => {
  try {
    if (!isRecording && typeof recorder !== 'undefined' && stream?.active) {
      setIsRecording(true)
      recorder.startRecording()
      return
    }

    setIsRecording(false)
    if (typeof recorder !== 'undefined') {
      recorder.stopRecording(() => {
        handleStopRecording({
          recorder,
          setRecorder,
          setError,
          useMp3,
          setIsConverting,
          setLastRecording,
        })
      })
    }
  } catch (error) {
    setError(toError(error))
  }
}

function Main() {
  const [isRecording, setIsRecording] = React.useState(false)
  const [recorder, setRecorder] = React.useState<RecordRTC>()
  const [stream, setStream] = React.useState<MediaStream>()
  const [error, setError] = React.useState<Error>()
  const [useMp3, setUseMp3] = React.useState<boolean>(false) // either 'audio/wav' or 'audio/mpeg' (MP3)
  const [volumeLevel, setVolumeLevel] = React.useState<number>(0)
  const [isConverting, setIsConverting] = React.useState<boolean>(false)
  const [lastRecording, setLastRecording] = React.useState<{
    blob: Blob
    filename: string
  } | null>(null)
  const animationFrameRef = React.useRef<number>()
  const audioContextRef = React.useRef<AudioContext>()
  const analyserRef = React.useRef<AnalyserNode>()
  const dataArrayRef = React.useRef<Uint8Array>()

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
        console.error('Error setting up audio analysis:', err)
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
      })
      return
    }
    if (typeof recorder === 'undefined') {
      const nextRecorder = await handleRecorder({
        recorder,
        setError,
        setRecorder,
        stream,
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
    })
  }
  const handleChange = () => setUseMp3((prevUseMp3) => !prevUseMp3)

  const [pendingShare, setPendingShare] = React.useState<{
    arrayBuffer: ArrayBuffer
    filename: string
    fileType: string
  } | null>(null)

  // Function to send large files in chunks
  const sendFileInChunks = (
    targetWindow: Window,
    buffer: ArrayBuffer,
    fileData: { filename: string; fileType: string },
  ) => {
    const chunkSize = 2 * 1024 * 1024 // 2MB chunks (larger for better speed)
    const totalChunks = Math.ceil(buffer.byteLength / chunkSize)
    let chunkIndex = 0

    const sendNextChunk = () => {
      if (chunkIndex >= totalChunks) {
        return
      }

      if (targetWindow.closed) {
        return
      }

      const start = chunkIndex * chunkSize
      const end = Math.min(start + chunkSize, buffer.byteLength)
      const chunk = buffer.slice(start, end)

      try {
        targetWindow.postMessage(
          {
            type: 'SHARED_AUDIO_CHUNK',
            chunkIndex,
            totalChunks,
            chunk,
            filename: fileData.filename,
            fileType: fileData.fileType,
          },
          'https://montage.directpodcast.fr',
        )

        chunkIndex++
        // Use requestAnimationFrame for faster, smoother transfer
        requestAnimationFrame(sendNextChunk)
      } catch {
        alert("Erreur lors de l'envoi du fichier. Veuillez réessayer.")
      }
    }

    sendNextChunk()
  }

  // Function to send data to a target window
  const waitAndSend = (
    targetWindow: Window,
    buffer: ArrayBuffer,
    fileData: { filename: string; fileType: string },
  ) => {
    if (targetWindow.closed) {
      return
    }

    // Use single transfer for smaller files (< 10MB), chunked for larger files
    const maxSingleTransferSize = 10 * 1024 * 1024 // 10MB

    if (buffer.byteLength <= maxSingleTransferSize) {
      // Send as single file for faster transfer
      try {
        targetWindow.postMessage(
          {
            type: 'SHARED_AUDIO_FILE',
            filename: fileData.filename,
            fileType: fileData.fileType,
            arrayBuffer: buffer,
          },
          'https://montage.directpodcast.fr',
        )
      } catch {
        // Fallback to chunked transfer if single transfer fails
        sendFileInChunks(targetWindow, buffer, fileData)
      }
    } else {
      // Use chunked transfer for large files
      sendFileInChunks(targetWindow, buffer, fileData)
    }
  }

  // Set up message listener once when component mounts
  React.useEffect(() => {
    const handleHandshake = (event: MessageEvent) => {
      if (event.origin !== 'https://montage.directpodcast.fr' || !pendingShare)
        return

      if (event.data === 'MONTAGE_READY') {
        try {
          ;(event.source as Window)?.postMessage(
            'READY_ACKNOWLEDGED',
            'https://montage.directpodcast.fr',
          )

          // Send the file data
          waitAndSend(
            event.source as Window,
            pendingShare.arrayBuffer,
            pendingShare,
          )

          // Clear pending share
          setPendingShare(null)
        } catch (error) {
          alert("Erreur lors de l'envoi du fichier. Veuillez réessayer.")
        }
      }
    }

    window.addEventListener('message', handleHandshake)

    return () => {
      window.removeEventListener('message', handleHandshake)
    }
  }, [pendingShare, waitAndSend, sendFileInChunks])

  const handleShareToMontage = async () => {
    if (!lastRecording) return

    try {
      // Prepare the data and store it for when Direct Montage is ready
      const arrayBuffer = await lastRecording.blob.arrayBuffer()
      setPendingShare({
        arrayBuffer,
        filename: lastRecording.filename,
        fileType: lastRecording.blob.type,
      })
    } catch {
      alert("Échec du partage de l'enregistrement. Veuillez réessayer.")
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
          <ConversionIndicator>Converting to MP3...</ConversionIndicator>
        )}
        {lastRecording && !isRecording && !isConverting && (
          <ShareButton
            href='https://montage.directpodcast.fr?sharing=true'
            target='_blank'
            rel='noopener noreferrer'
            onClick={handleShareToMontage}
          >
            Partager vers Direct Montage
          </ShareButton>
        )}
      </Form>
      <StyledFooter />
    </Container>
  )
}

export default Main
