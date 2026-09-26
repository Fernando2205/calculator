export type BinaryOperation = 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'percentage'
export type Operation = BinaryOperation | 'sqrt'

/** Client-side error code used when the API cannot be reached. */
export const NETWORK_ERROR = 'NETWORK'

const INVALID_RESPONSE = 'INVALID_RESPONSE'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

/** Error returned by the API (or by the client when the request fails). */
export class ApiError extends Error {
  readonly code: string

  constructor (code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

interface SuccessBody {
  result: number
}

interface ErrorBody {
  error: { code: string, message: string }
}

/**
 * Asks the backend to compute an operation. Resolves with the result or
 * rejects with an ApiError carrying the error code and message.
 */
export async function calculate (operation: Operation, a: number, b?: number): Promise<number> {
  const body = operation === 'sqrt' ? { a } : { a, b }

  let response: Response
  try {
    response = await fetch(`${API_URL}/api/v1/${operation}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  } catch {
    throw new ApiError(NETWORK_ERROR, 'failed to reach api')
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new ApiError(INVALID_RESPONSE, 'unexpected response from api')
  }

  if (!response.ok) {
    const { error } = data as ErrorBody
    throw new ApiError(error.code, error.message)
  }
  return (data as SuccessBody).result
}

/** Reports whether the backend health check answers successfully. */
export async function checkHealth (): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/healthz`)
    return response.ok
  } catch {
    return false
  }
}
