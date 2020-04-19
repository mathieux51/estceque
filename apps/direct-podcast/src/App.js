import React from "react"
import styled, { createGlobalStyle } from "styled-components"
import { normalize } from "polished"
import RecordRTC from "recordrtc"
import adapter from "webrtc-adapter"
import Mic from "./components/Mic"
import MicOff from "./components/MicOff"
import ErrorBoundary from './components/ErrorBoundary'

const GlobalStyle = createGlobalStyle`
  ${normalize()}

`

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  background: #ffb732;
  display: flex;
  justify-content: center;
  align-items: center;
`
const A = styled.a`
  width: 8rem;
  height: 8rem;
  cursor: pointer;
`

const StyledMic = styled(Mic)`
  & path {
    fill: crimson;
  }
`

function App() {
  const [isRecording, setIsRecording] = React.useState(false)
  const [recorder, setRecorder] = React.useState(null)

  React.useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!recorder) {
          const recorder = RecordRTC(stream, {
            recorderType: RecordRTC.StereoAudioRecorder,
            mimeType: "audio/wav",
          })

          setRecorder(recorder)
        }
      })
      .catch((error) => console.error(error))
  }, [recorder])

  const handleClick = (evt) => {
    if (!isRecording) {
      setIsRecording(true)
      recorder.startRecording()
      return
    }

    setIsRecording(false)
    recorder.stopRecording(() => {
      let blob = recorder.getBlob()

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

      // RecordRTC.invokeSaveAsDialog(blob)
      setRecorder(null)
    })
  }

  return (
    <ErrorBoundary>
      <GlobalStyle />
      <Container
        data-browser={adapter.browserDetails.browser}
        data-version={adapter.browserDetails.version}
      >
        <A onClick={handleClick}>{isRecording ? <StyledMic /> : <MicOff />}</A>
      </Container>
    </ErrorBoundary>
  )
}

export default App
