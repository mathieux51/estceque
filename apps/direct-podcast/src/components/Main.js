import React from "react"
import styled from "styled-components"
import RecordRTC from "recordrtc"
import adapter from "webrtc-adapter"
import Mic from "./Mic"
import MicOff from "./MicOff"

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  background: #ffb732;
  display: flex;
  justify-content: center;
  align-items: center;
`
const Button = styled.button`
  width: 8rem;
  height: 8rem;
  cursor: pointer;
`

const StyledMic = styled(Mic)`
  & path {
    fill: crimson;
  }
`

const handleStopRecording = (recorder, setRecorder) => () => {
  const blob = recorder.getBlob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.style.display = "none"
  a.href = url

  a.download = `${Date.now()}.wav`
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

const handleGetUserMedia = async ({ recorder, setRecorder, setError }) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    if (!recorder) {
      const recorder = RecordRTC(stream, {
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
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    handleGetUserMedia({ recorder, setRecorder, setError })
  }, [recorder, isRecording])

  const handleClick = (evt) => {
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
    <Container
      data-browser={adapter.browserDetails.browser}
      data-version={adapter.browserDetails.version}
    >
      <Button onClick={handleClick}>{isRecording ? <StyledMic /> : <MicOff />}</Button>
    </Container>
  )
}

export default Main
