import React from 'react'
import styled from 'styled-components'

const CounterText = styled.span`
  color: ${(props) => props.theme.grey};
  font-size: 24px;
  font-family: 'Antipasto', sans-serif;
`

function toHHMMSS(seconds: number) {
  const format = (val: number) => `0${Math.floor(val)}`.slice(-2)
  const hours = seconds / 3600
  const minutes = (seconds % 3600) / 60

  return [hours, minutes, seconds % 60].map(format).join(':')
}

const Counter = () => {
  const [count, setCount] = React.useState(0)

  const requestRef = React.useRef(0)
  const previousTimeRef = React.useRef(0)

  const animate = React.useCallback((time: number) => {
    if (previousTimeRef && previousTimeRef.current) {
      const deltaTime = time - previousTimeRef.current

      setCount((prevCount) => prevCount + deltaTime * 0.001)
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }, [])

  React.useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current)
  }, [animate])

  return <CounterText>{toHHMMSS(Math.round(count))}</CounterText>
}

type Props = {
  isRecording: boolean
}

const Timer: React.FC<Props> = ({ isRecording }) =>
  isRecording ? <Counter /> : <CounterText>00:00:00</CounterText>

export default Timer
