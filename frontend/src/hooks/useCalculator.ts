import { useReducer, useRef } from 'react'
import { ApiError, type ApiStatus, type BinaryOperation, calculate, NETWORK_ERROR } from '../api/client'
import { getDisplay } from '../calculator/display'
import {
  type Action,
  type CalcRequest,
  calculatorReducer,
  equalsRequest,
  initialState,
  sqrtRequest
} from '../calculator/reducer'
import { formatNumber } from '../lib/format'
import type { Digit, KeyId } from '../lib/keys'

const isDigitKey = (key: KeyId): key is `d${Digit}` => /^d[0-9]$/.test(key)

/**
 * Connects the pure calculator reducer to the API: it turns key presses into
 * reducer actions and runs the requests described by equalsRequest/sqrtRequest.
 */
export function useCalculator (onApiStatus?: (status: ApiStatus) => void) {
  const [state, dispatch] = useReducer(calculatorReducer, initialState)
  // Mirror of the state that is updated synchronously, so a request can be
  // planned right after the previous one finishes (e.g. "5 + √9 =" runs √9
  // and then 5 + 3) without waiting for React to re-render.
  const latest = useRef(state)
  // Guards against a second request before React re-renders with loading = true.
  const busy = useRef(false)

  function apply (action: Action) {
    latest.current = calculatorReducer(latest.current, action)
    dispatch(action)
  }

  async function run (request: CalcRequest): Promise<boolean> {
    apply({ type: 'requestStarted' })
    try {
      const result = await calculate(request.operation, request.a, request.b)
      apply({ type: 'requestSucceeded', request, result: formatNumber(result) })
      onApiStatus?.('online')
      return true
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN', 'unexpected error')
      onApiStatus?.(apiError.code === NETWORK_ERROR ? 'offline' : 'online')
      apply({ type: 'requestFailed', request, message: apiError.message })
      return false
    }
  }

  /** Runs whatever is pending: first a √ on the current operand, then the binary operation. */
  async function resolvePending (): Promise<boolean> {
    busy.current = true
    try {
      const sqrt = sqrtRequest(latest.current)
      if (sqrt && !(await run(sqrt))) return false
      const pending = equalsRequest(latest.current)
      if (pending && !(await run(pending))) return false
      return true
    } finally {
      busy.current = false
    }
  }

  async function setOperator (op: BinaryOperation) {
    // "7 + 2 ×" first resolves "7 + 2" and then applies × to the result.
    if (await resolvePending()) apply({ type: 'setOperator', op })
  }

  function press (key: KeyId) {
    if (busy.current) return

    if (isDigitKey(key)) {
      apply({ type: 'digit', digit: key.slice(1) })
      return
    }

    switch (key) {
      case 'dot':
      case 'sign':
      case 'back':
      case 'clear':
      case 'sqrt':
        apply({ type: key })
        break
      case 'equals':
        resolvePending()
        break
      default:
        setOperator(key)
    }
  }

  function reuse (value: string) {
    if (busy.current) return
    apply({ type: 'reuse', value })
  }

  return { state, display: getDisplay(state), press, reuse }
}
