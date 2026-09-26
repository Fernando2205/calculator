import { useEffect, useRef } from 'react'
import { type KeyId, keyFromKeyboard } from '../lib/keys'
import { flashKey } from '../lib/motion'

/**
 * Listens to keyboard shortcuts on the whole window, flashes the matching
 * on-screen key and forwards it to onKey. Ctrl/Meta combos are left to the
 * browser (copy, reload…).
 */
export function useKeyboard (onKey: (key: KeyId) => void) {
  // Keep the latest callback without re-subscribing the listener on every render.
  const onKeyRef = useRef(onKey)
  useEffect(() => {
    onKeyRef.current = onKey
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) return
      const key = keyFromKeyboard(event.key)
      if (!key) return

      // Stops Enter from also clicking a focused key and "/" from opening quick find.
      event.preventDefault()
      flashKey(key)
      onKeyRef.current(key)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
