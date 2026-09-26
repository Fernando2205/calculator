import { describe, expect, it } from 'vitest'
import { getDisplay, valueSize } from './display'
import { type CalculatorState, initialState } from './reducer'

function state (overrides: Partial<CalculatorState> = {}): CalculatorState {
  return { ...initialState, ...overrides }
}

describe('getDisplay', () => {
  it('shows the first operand while typing', () => {
    expect(getDisplay(state({ a: '12' }))).toEqual({
      expression: '',
      value: '12',
      status: { tone: 'none', text: '' },
      isError: false
    })
  })

  it('shows "a" and the operator while waiting for "b"', () => {
    expect(getDisplay(state({ a: '12', op: 'multiply' }))).toMatchObject({
      expression: '12 ×',
      value: '12'
    })
  })

  it('shows "b" once the user types it', () => {
    expect(getDisplay(state({ a: '12', op: 'multiply', b: '3' }))).toMatchObject({
      expression: '12 ×',
      value: '3'
    })
  })

  it('shows a pending square root before its number', () => {
    expect(getDisplay(state({ a: '', sqrt: true })).value).toBe('√')
    expect(getDisplay(state({ a: '16', sqrt: true })).value).toBe('√16')
  })

  it('shows a pending square root on "b" after the operator', () => {
    expect(getDisplay(state({ a: '5', op: 'add', b: '9', sqrt: true }))).toMatchObject({
      expression: '5 +',
      value: '√9'
    })
  })

  it('shows the result with its expression and an ok status', () => {
    expect(getDisplay(state({ a: '9', result: '9', expr: '7 + 2', fresh: true }))).toEqual({
      expression: '7 + 2 =',
      value: '9',
      status: { tone: 'ok', text: '✓ 200 ok' },
      isError: false
    })
  })

  it('shows the error with the failed expression', () => {
    expect(getDisplay(state({ error: 'division by zero', expr: '5 ÷ 0', fresh: true }))).toEqual({
      expression: '5 ÷ 0',
      value: 'Error',
      status: { tone: 'error', text: '✕ division by zero' },
      isError: true
    })
  })

  it('shows a computing status while a request is in flight', () => {
    expect(getDisplay(state({ a: '7', op: 'add', b: '2', loading: true })).status).toEqual({
      tone: 'muted',
      text: '~ $ computing…'
    })
  })
})

describe('valueSize', () => {
  it.each([
    ['123456789', 'lg'],
    ['1234567890', 'md'],
    ['1234567890123', 'md'],
    ['12345678901234', 'sm']
  ] as const)('sizes "%s" as %s', (value, size) => {
    expect(valueSize(value)).toBe(size)
  })
})
