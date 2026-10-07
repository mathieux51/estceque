import React from 'react'

const useClickOutide = (
  ref: React.RefObject<HTMLButtonElement>,
  callback: () => void
) => {
  const callbackRef = React.useRef<() => void>()
  callbackRef.current = callback

  const handleClick = React.useCallback(
    (event: MouseEvent) => {
      if (
        callbackRef.current &&
        ref.current &&
        event.target &&
        !ref.current.contains(event.target as Node)
      ) {
        callbackRef.current()
      }
    },
    [ref]
  )
  React.useEffect(() => {
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [handleClick])
}

export default useClickOutide
