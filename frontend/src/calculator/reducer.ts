import type { BinaryOperation, Operation } from '../api/client'
import { formatNumber } from '../lib/format'

const MAX_DIGITS = 15

/** Symbols used to display each operation in expressions. */
export const SYMBOLS: Record<Operation, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
  power: '^',
  percentage: '% of',
  sqrt: '√'
}

export interface HistoryEntry {
  expr: string
  result: string
}

export interface CalculatorState {
  /** First operand, as typed. */
  a: string
  /** Pending binary operator. */
  op: BinaryOperation | null
  /** Second operand, as typed. Empty until the user types it. */
  b: string
  /** Formatted result of the last calculation, shown in the display. */
  result: string | null
  /** Expression of the last calculation, e.g. "7 + 2". */
  expr: string
  /** Error message of the last failed calculation. */
  error: string | null
  /** Whether a request to the API is in flight. */
  loading: boolean
  /** Whether "a" holds a result, so the next digit starts a new number. */
  fresh: boolean
  history: HistoryEntry[]
}

/** A calculation to send to the API and where to store its result. */
export interface CalcRequest {
  operation: Operation
  a: number
  b?: number
  expr: string
  /** "a" shows the result as a finished calculation; "b" replaces the second operand. */
  target: 'a' | 'b'
}

export type Action =
  | { type: 'digit', digit: string }
  | { type: 'dot' }
  | { type: 'sign' }
  | { type: 'back' }
  | { type: 'clear' }
  | { type: 'setOperator', op: BinaryOperation }
  | { type: 'reuse', value: string }
  | { type: 'requestStarted' }
  | { type: 'requestSucceeded', request: CalcRequest, result: string }
  | { type: 'requestFailed', request: CalcRequest, message: string }

export const initialState: CalculatorState = {
  a: '0',
  op: null,
  b: '',
  result: null,
  expr: '',
  error: null,
  loading: false,
  fresh: false,
  history: []
}

/** Fields reset when a new calculation starts; the history is kept. */
const cleared = {
  a: '0',
  op: null,
  b: '',
  result: null,
  expr: '',
  error: null,
  fresh: false
} satisfies Partial<CalculatorState>

const current = (s: CalculatorState) => (s.op ? s.b : s.a)

const withCurrent = (s: CalculatorState, value: string): CalculatorState =>
  s.op ? { ...s, b: value } : { ...s, a: value }

/** An operand can be sent once it has at least one digit. */
const isComplete = (value: string) => value !== '' && value !== '-'

/** Whether the next input should discard the displayed result or error. */
const startsOver = (s: CalculatorState) => (s.fresh || s.error !== null) && !s.op

export function calculatorReducer (s: CalculatorState, action: Action): CalculatorState {
  if (s.loading && action.type !== 'requestSucceeded' && action.type !== 'requestFailed') {
    return s
  }

  switch (action.type) {
    case 'digit': {
      if (startsOver(s)) return { ...s, ...cleared, a: action.digit }
      const value = current(s)
      if (value.replace(/[-.]/g, '').length >= MAX_DIGITS) return s
      const next = value === '0' ? action.digit : value === '-0' ? `-${action.digit}` : value + action.digit
      return { ...withCurrent(s, next), fresh: false, result: null, expr: '' }
    }

    case 'dot': {
      if (startsOver(s)) return { ...s, ...cleared, a: '0.' }
      const value = current(s)
      if (value.includes('.')) return s
      return withCurrent(s, value === '' ? '0.' : `${value}.`)
    }

    case 'sign': {
      const value = current(s)
      if (value === '' || s.error) return s
      const next = value.startsWith('-') ? value.slice(1) : `-${value}`
      return { ...withCurrent(s, next), fresh: false, result: null }
    }

    case 'back': {
      if (s.error || s.fresh) return { ...s, ...cleared }
      if (s.op && s.b === '') return { ...s, op: null }
      const next = current(s).slice(0, -1)
      const emptied = next === '' || next === '-'
      return withCurrent(s, emptied ? (s.op ? '' : '0') : next)
    }

    case 'clear':
      return { ...s, ...cleared }

    case 'setOperator':
      if (s.error) return s
      return { ...s, op: action.op, b: '', fresh: false, result: null, expr: '' }

    case 'reuse':
      return { ...s, ...cleared, a: action.value }

    case 'requestStarted':
      return { ...s, loading: true, error: null }

    case 'requestSucceeded': {
      const { request, result } = action
      const history = [...s.history, { expr: request.expr, result }]
      if (request.target === 'b') return { ...s, b: result, loading: false, history }
      return {
        ...s,
        a: result,
        op: null,
        b: '',
        result,
        expr: request.expr,
        fresh: true,
        loading: false,
        history
      }
    }

    case 'requestFailed':
      return {
        ...s,
        error: action.message,
        expr: action.request.expr,
        op: null,
        b: '',
        fresh: true,
        loading: false
      }
  }
}

/** Builds the request for "=", or null if the calculation is not ready. */
export function equalsRequest (s: CalculatorState): CalcRequest | null {
  if (s.loading || !s.op || !isComplete(s.b)) return null
  const a = parseFloat(s.a)
  const b = parseFloat(s.b)
  return {
    operation: s.op,
    a,
    b,
    expr: `${formatNumber(a)} ${SYMBOLS[s.op]} ${formatNumber(b)}`,
    target: 'a'
  }
}

/** Builds the request for √ on the current operand, or null if it cannot run. */
export function sqrtRequest (s: CalculatorState): CalcRequest | null {
  const value = current(s)
  if (s.loading || s.error || !isComplete(value)) return null
  const a = parseFloat(value)
  return {
    operation: 'sqrt',
    a,
    expr: `${SYMBOLS.sqrt}(${formatNumber(a)})`,
    target: s.op ? 'b' : 'a'
  }
}
