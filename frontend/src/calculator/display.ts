import { type CalculatorState, SYMBOLS } from './reducer'

export type StatusTone = 'none' | 'ok' | 'error' | 'muted'
export type ValueSize = 'lg' | 'md' | 'sm'

export interface DisplayModel {
  /** Small line above the value, e.g. "7 + 2 =". */
  expression: string
  /** Main value: the operand being typed, the result or "Error". */
  value: string
  status: { tone: StatusTone, text: string }
  isError: boolean
}

/** Derives what the calculator display shows from the calculator state. */
export function getDisplay (s: CalculatorState): DisplayModel {
  let model: DisplayModel
  if (s.error) {
    model = {
      expression: s.expr,
      value: 'Error',
      status: { tone: 'error', text: `✕ ${s.error}` },
      isError: true
    }
  } else if (s.result !== null) {
    model = {
      expression: `${s.expr} =`,
      value: s.result,
      status: { tone: 'ok', text: '✓ 200 ok' },
      isError: false
    }
  } else if (s.op) {
    model = {
      expression: `${s.a} ${SYMBOLS[s.op]}`,
      value: s.sqrt ? `${SYMBOLS.sqrt}${s.b}` : s.b === '' ? s.a : s.b,
      status: { tone: 'none', text: '' },
      isError: false
    }
  } else {
    model = {
      expression: '',
      value: s.sqrt ? `${SYMBOLS.sqrt}${s.a}` : s.a,
      status: { tone: 'none', text: '' },
      isError: false
    }
  }

  if (s.loading) model.status = { tone: 'muted', text: '~ $ computing…' }
  return model
}

/** Picks the font size of the main value so long numbers still fit. */
export function valueSize (value: string): ValueSize {
  if (value.length <= 9) return 'lg'
  if (value.length <= 13) return 'md'
  return 'sm'
}
