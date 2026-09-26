import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, calculate, checkHealth, NETWORK_ERROR } from './client'

function jsonResponse (body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

function mockFetch (impl: () => Promise<Response>) {
  const fetchMock = vi.fn(impl)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('calculate', () => {
  it('posts both operands to the operation endpoint and returns the result', async () => {
    const fetchMock = mockFetch(async () => jsonResponse({ operation: 'add', result: 9 }))

    await expect(calculate('add', 7, 2)).resolves.toBe(9)

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/api/v1/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: 7, b: 2 })
    })
  })

  it('sends only operand "a" for sqrt', async () => {
    const fetchMock = mockFetch(async () => jsonResponse({ operation: 'sqrt', result: 4 }))

    await expect(calculate('sqrt', 16)).resolves.toBe(4)

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://localhost:8080/api/v1/sqrt')
    expect(init.body).toBe(JSON.stringify({ a: 16 }))
  })

  it('rejects with the code and message returned by the API', async () => {
    mockFetch(async () => jsonResponse(
      { error: { code: 'DIVISION_BY_ZERO', message: 'division by zero' } },
      422
    ))

    const error = await calculate('divide', 5, 0).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'DIVISION_BY_ZERO', message: 'division by zero' })
  })

  it('rejects with a network error when the API cannot be reached', async () => {
    mockFetch(async () => { throw new TypeError('Failed to fetch') })

    const error = await calculate('add', 1, 2).catch((e: unknown) => e)

    expect(error).toMatchObject({ code: NETWORK_ERROR, message: 'failed to reach api' })
  })

  it('rejects with a generic error when the response is not valid JSON', async () => {
    mockFetch(async () => new Response('<html>Bad Gateway</html>', { status: 502 }))

    const error = await calculate('add', 1, 2).catch((e: unknown) => e)

    expect(error).toMatchObject({ code: 'INVALID_RESPONSE', message: 'unexpected response from api' })
  })
})

describe('checkHealth', () => {
  it('returns true when the health endpoint answers 200', async () => {
    const fetchMock = mockFetch(async () => jsonResponse({ status: 'ok' }))

    await expect(checkHealth()).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/healthz')
  })

  it('returns false when the health endpoint fails', async () => {
    mockFetch(async () => jsonResponse({}, 500))

    await expect(checkHealth()).resolves.toBe(false)
  })

  it('returns false when the API cannot be reached', async () => {
    mockFetch(async () => { throw new TypeError('Failed to fetch') })

    await expect(checkHealth()).resolves.toBe(false)
  })
})
