import React from "react"

const useClickOutide = (ref, callback) => {
  const callbackRef = React.useRef()
  callbackRef.current = callback

  const handleClick = React.useCallback(
    (evt) => {
      if (ref.current && evt.target && !ref.current.contains(evt.target)) {
        callbackRef.current(evt)
      }
    },
    [ref]
  )
  React.useEffect(() => {
    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [handleClick])
}

export default useClickOutide
