import React from 'react'

type Value = string | undefined

const usePrevious = (value: Value) => {
  const ref = React.useRef<Value>()
  React.useEffect(() => {
    ref.current = value
  })
  return ref.current
}

export default usePrevious
