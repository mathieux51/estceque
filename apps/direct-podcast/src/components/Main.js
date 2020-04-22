import React from "react"
import styled from "styled-components"
import RecordRTC from "recordrtc"
import Mic from "./Mic"
import MicOff from "./MicOff"
import Timer, { TimerText } from "./Timer"
import Footer from "./Footer"

const addZero = str => str.length === 1 ? `0${str}` : str

const getFilename = () => {
  const now = new Date()
  const d = addZero(now.getDate().toString())
  const m = addZero(now.getMonth().toString())
  const y = now.getFullYear()
  const h = addZero(now.getHours().toString())
  const min = addZero(now.getMinutes().toString())
  const s = addZero(now.getSeconds().toString())

  return `${d}.${m}.${y}-${h}.${min}.${s}.wav`
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  background: ${(props) => props.theme.blue};
  flex-direction: column;
`
const Button = styled.button`
  width: 12rem;
  height: 12rem;
  cursor: pointer;
`

const Form = styled.form`
  height: 80%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`

const StyledFooter = styled(Footer)`
  height: 20%;
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

const handleStopRecording = (recorder, setRecorder) => () => {
  const blob = recorder.getBlob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.style.display = "none"
  a.href = url

  a.download = getFilename()
  document.body.appendChild(a)
  a.click()

  setTimeout(() => {
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, 1000)

  // bug on Safari iOS
  // RecordRTC.invokeSaveAsDialog(blob)
  setRecorder(null)
}

const handleSetStream = async ({ setError, setStream }) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    })
    setStream(stream)
  } catch (error) {
    setError(error)
  }
}

const handleGetUserMedia = async ({
  recorder,
  setRecorder,
  setError,
  stream,
}) => {
  try {
    if (stream && !recorder) {
      const recorder = RecordRTC(stream.clone(), {
        recorderType: RecordRTC.StereoAudioRecorder,
        mimeType: "audio/wav",
      })

      setRecorder(recorder)
    }
  } catch (error) {
    setError(error)
  }
}

function Main() {
  const [isRecording, setIsRecording] = React.useState(false)
  const [recorder, setRecorder] = React.useState(null)
  const [stream, setStream] = React.useState(null)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    handleSetStream({ setStream, setError })
  }, [])

  React.useEffect(() => {
    handleGetUserMedia({ recorder, setRecorder, setError, stream })
  }, [recorder, isRecording, stream])

  const handleSubmit = (evt) => {
    evt.preventDefault()
    evt.stopPropagation()

    if (!isRecording) {
      setIsRecording(true)
      if (recorder) {
        recorder.startRecording()
      }
      return
    }

    setIsRecording(false)
    if (recorder) {
      recorder.stopRecording(handleStopRecording(recorder, setRecorder))
    }
  }

  if (error) {
    throw error
  }

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Button type="submit" aria-label="enregistrer">
          {isRecording ? <StyledMic /> : <StyledMicOff />}
        </Button>
        {isRecording ? <Timer /> : <TimerText>00:00:00</TimerText>}
      </Form>
      <StyledFooter />
    </Container>
  )
}

export default Main
