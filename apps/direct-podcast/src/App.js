import React from "react"
import styled from "styled-components"

const Container = styled.div``
const Button = styled.button``

function App() {
  const audioRef = React.createRef(null)
  const [isRecording, setIsRecording] = React.useState(false)
  const [mediaRec, setMediaRec] = React.useState(null)

  if (mediaRec) {
    let samples = []
    mediaRec.ondataavailable = (evt) => {
      samples.push(evt.data)
      if (mediaRec.state === "inactive") {
        const blob = new Blob(samples, { type: "audio/mpeg-3" })
        const u = URL.createObjectURL(blob)
        audioRef.current.src = u
        audioRef.current.controls = true
        audioRef.current.autoplay = true
        setMediaRec(null)
        const a = document.createElement("a")
        a.href = u
        a.download = "test.mpg3"
        a.click()
        window.URL.revokeObjectURL(u)
      }
    }
  }

  React.useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!mediaRec) {
          setMediaRec(new MediaRecorder(stream))
        }
      })
      .catch((error) => console.error(error))
  }, [mediaRec])

  const handleClick = (evt) => {
    if (!isRecording) {
      setIsRecording(true)
      mediaRec.start()
      return
    }

    setIsRecording(false)
    mediaRec.stop()
  }

  return (
    <Container>
      <h1>Direct podcast</h1>
      <Button onClick={handleClick}>Record</Button>
      <audio ref={audioRef} />
    </Container>
  )
}

export default App
