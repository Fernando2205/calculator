import { useReducer, useRef } from 'react'
import { ApiError, type ApiStatus, type BinaryOperation, calculate, NETWORK_ERROR } from '../api/client'
import { getDisplay } from '../calculator/display'
import {
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
  // Guards against a second request before React re-renders with loading = true.
  const busy = useRef(false)

  async function run (request: CalcRequest): Promise<boolean> {
    busy.current = true
    dispatch({ type: 'requestStarted' })
    try {
      const result = await calculate(request.operation, request.a, request.b)
      dispatch({ type: 'requestSucceeded', request, result: formatNumber(result) })
      onApiStatus?.('online')
      return true
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN', 'unexpected error')
      onApiStatus?.(apiError.code === NETWORK_ERROR ? 'offline' : 'online')
      dispatch({ type: 'requestFailed', request, message: apiError.message })
      return false
    } finally {
      busy.current = false
    }
  }

  async function setOperator (op: BinaryOperation) {
    // "7 + 2 ×" first resolves "7 + 2" and then applies × to the result.
    const pending = equalsRequest(state)
    if (pending && !(await run(pending))) return
    dispatch({ type: 'setOperator', op })
  }

  function press (key: KeyId) {
    if (busy.current) return

    if (isDigitKey(key)) {
      dispatch({ type: 'digit', digit: key.slice(1) })
      return
    }

    switch (key) {
      case 'dot':
      case 'sign':
      case 'back':
      case 'clear':
        dispatch({ type: key })
        break
      case 'equals': {
        const request = equalsRequest(state)
        if (request) run(request)
        break
      }
      case 'sqrt': {
        const request = sqrtRequest(state)
        if (request) run(request)
        break
      }
      default:
        setOperator(key)
    }
  }

  function reuse (value: string) {
    if (busy.current) return
    dispatch({ type: 'reuse', value })
  }

  return { state, display: getDisplay(state), press, reuse }
}
