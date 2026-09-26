import { useEffect, useState } from 'react'
import { type ApiStatus, checkHealth } from '../api/client'

const DEFAULT_INTERVAL_MS = 15_000

/**
 * Polls the backend health check on mount and every intervalMs.
 * Also returns a setter so other requests can report what they observed
 * (e.g. a calculation that failed to reach the API).
 */
export function useApiHealth (intervalMs = DEFAULT_INTERVAL_MS) {
  const [status, setStatus] = useState<ApiStatus>('checking')

  useEffect(() => {
    let active = true
    const check = async () => {
      const online = await checkHealth()
      if (active) setStatus(online ? 'online' : 'offline')
    }

    check()
    const id = setInterval(check, intervalMs)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [intervalMs])

  return [status, setStatus] as const
}
