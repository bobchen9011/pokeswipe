import { useState, useEffect, useRef } from 'react'

export default function Toast({ message, onClear }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!message) return
    setVisible(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(onClear, 400) // clear after fade-out
    }, 2800)
  }, [message]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!message) return null

  return (
    <div className={`toast${visible ? ' show' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  )
}
