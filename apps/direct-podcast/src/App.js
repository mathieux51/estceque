import React from "react"
import styled, { createGlobalStyle } from "styled-components"
import { normalize } from 'polished'
import RecordRTC from "recordrtc"
import Mic from './components/Mic'
import MicOff from './components/MicOff'


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
      RecordRTC.invokeSaveAsDialog(blob)
      setRecorder(null)
    })
  }

  return (
    <>
    <GlobalStyle />
    <Container>
      <A onClick={handleClick}>
      {isRecording ? <StyledMic /> : <MicOff />}
        </A>
    </Container>
    </>
  )
}

export default App
