import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useApiHealth } from './useApiHealth'

function mockHealth (...answers: boolean[]) {
  const fetchMock = vi.fn(async () => {
    const ok = answers.length > 1 ? answers.shift()! : answers[0]
    return new Response('{}', { status: ok ? 200 : 503 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useApiHealth', () => {
  it('starts as checking and becomes online when the health check succeeds', async () => {
    mockHealth(true)
    const { result } = renderHook(() => useApiHealth())

    expect(result.current[0]).toBe('checking')
    await waitFor(() => expect(result.current[0]).toBe('online'))
  })

  it('becomes offline when the health check fails', async () => {
    mockHealth(false)
    const { result } = renderHook(() => useApiHealth())

    await waitFor(() => expect(result.current[0]).toBe('offline'))
  })

  it('checks again on every interval', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const fetchMock = mockHealth(true, false)
    const { result } = renderHook(() => useApiHealth(1000))
    await waitFor(() => expect(result.current[0]).toBe('online'))

    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(result.current[0]).toBe('offline'))
  })

  it('stops checking after unmount', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const fetchMock = mockHealth(true)
    const { unmount } = renderHook(() => useApiHealth(1000))
    unmount()

    await act(async () => { await vi.advanceTimersByTimeAsync(5000) })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('lets callers report the status observed on other requests', async () => {
    mockHealth(true)
    const { result } = renderHook(() => useApiHealth())
    await waitFor(() => expect(result.current[0]).toBe('online'))

    act(() => result.current[1]('offline'))

    expect(result.current[0]).toBe('offline')
  })
})
