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

const StyledMic = styled(Mic)`
  & path {
    fill: ${(props) => props.theme.red};
  }
`

const StyledMicOff = styled(MicOff)`
  & path {
    fill: ${(props) => props.theme.white};
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
}: {
  useMp3: boolean
  recorder: RecordRTC
  setError: React.Dispatch<React.SetStateAction<Error | undefined>>
  setRecorder: React.Dispatch<React.SetStateAction<RecordRTC | undefined>>
}) => {
  try {
    const blob = recorder.getBlob()
    if (useMp3) {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { toBlobURL } = await import('@ffmpeg/util')
      const ffmpeg = new FFmpeg()
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
      saveAs(new Blob([file]), mp3)
    } else {
      saveAs(blob, `${filename()}.wav`)
    }
    recorder.destroy()
    setRecorder(undefined)
  } catch (error) {
    setError(toError(error))
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
}: {
  stream: MediaStream | undefined
  isRecording: boolean
  recorder: RecordRTC | undefined
  setError: React.Dispatch<React.SetStateAction<Error | undefined>>
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>
  setRecorder: React.Dispatch<React.SetStateAction<RecordRTC | undefined>>
  useMp3: boolean
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
        handleStopRecording({ recorder, setRecorder, setError, useMp3 })
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
    })
  }
  const handleChange = () => setUseMp3((prevUseMp3) => !prevUseMp3)

  if (error) {
    throw error
  }

  return (
    <Container>
      <StyledHeader onChange={handleChange} />
      <Form onSubmit={handleSubmit}>
        <Button type='submit' aria-label='enregistrer'>
          {isRecording ? <StyledMic /> : <StyledMicOff />}
        </Button>
        <Timer isRecording={isRecording} />
      </Form>
      <StyledFooter />
    </Container>
  )
}

export default Main
