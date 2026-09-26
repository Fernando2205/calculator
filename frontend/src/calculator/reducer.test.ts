import { describe, expect, it } from 'vitest'
import {
  type Action,
  type CalculatorState,
  calculatorReducer,
  equalsRequest,
  initialState,
  sqrtRequest
} from './reducer'

function state (overrides: Partial<CalculatorState> = {}): CalculatorState {
  return { ...initialState, ...overrides }
}

function run (start: CalculatorState, ...actions: Action[]): CalculatorState {
  return actions.reduce(calculatorReducer, start)
}

const digits = (value: string): Action[] =>
  [...value].map((digit) => ({ type: 'digit', digit }))

describe('digit', () => {
  it('replaces the initial zero', () => {
    expect(run(initialState, ...digits('7')).a).toBe('7')
  })

  it('appends to the current operand', () => {
    expect(run(initialState, ...digits('123')).a).toBe('123')
  })

  it('types into "b" when an operator is pending', () => {
    const next = run(state({ a: '12', op: 'add' }), ...digits('34'))
    expect(next).toMatchObject({ a: '12', b: '34' })
  })

  it('keeps the sign when replacing a negative zero', () => {
    expect(run(state({ a: '-0' }), ...digits('5')).a).toBe('-5')
  })

  it('ignores digits beyond 15', () => {
    expect(run(initialState, ...digits('1234567890123456')).a).toBe('123456789012345')
  })

  it('does not count the sign and the dot as digits', () => {
    expect(run(state({ a: '-1.2345678901234' }), ...digits('5')).a).toBe('-1.23456789012345')
  })

  it('starts over after a result', () => {
    const next = run(state({ a: '9', result: '9', expr: '7 + 2', fresh: true }), ...digits('4'))
    expect(next).toMatchObject({ a: '4', result: null, expr: '', fresh: false })
  })

  it('starts over after an error', () => {
    const next = run(state({ error: 'division by zero', expr: '5 ÷ 0', fresh: true }), ...digits('4'))
    expect(next).toMatchObject({ a: '4', error: null, expr: '' })
  })
})

describe('dot', () => {
  it('adds a decimal point', () => {
    expect(run(state({ a: '3' }), { type: 'dot' }).a).toBe('3.')
  })

  it('allows only one decimal point per operand', () => {
    expect(run(state({ a: '3.1' }), { type: 'dot' }).a).toBe('3.1')
  })

  it('writes "0." into an empty "b"', () => {
    expect(run(state({ a: '3', op: 'add' }), { type: 'dot' }).b).toBe('0.')
  })

  it('starts over with "0." after a result', () => {
    const next = run(state({ a: '9', result: '9', fresh: true }), { type: 'dot' })
    expect(next).toMatchObject({ a: '0.', result: null, fresh: false })
  })
})

describe('sign', () => {
  it('toggles the sign of the current operand', () => {
    expect(run(state({ a: '5' }), { type: 'sign' }).a).toBe('-5')
    expect(run(state({ a: '-5' }), { type: 'sign' }).a).toBe('5')
  })

  it('toggles "b" when an operator is pending', () => {
    expect(run(state({ a: '5', op: 'add', b: '2' }), { type: 'sign' }).b).toBe('-2')
  })

  it('does nothing on an empty operand', () => {
    const start = state({ a: '5', op: 'add' })
    expect(run(start, { type: 'sign' })).toEqual(start)
  })

  it('keeps working on a result, which becomes editable', () => {
    const next = run(state({ a: '9', result: '9', fresh: true }), { type: 'sign' })
    expect(next).toMatchObject({ a: '-9', result: null, fresh: false })
  })
})

describe('back', () => {
  it('deletes the last character', () => {
    expect(run(state({ a: '123' }), { type: 'back' }).a).toBe('12')
  })

  it('goes back to zero when the operand is emptied', () => {
    expect(run(state({ a: '7' }), { type: 'back' }).a).toBe('0')
    expect(run(state({ a: '-7' }), { type: 'back' }).a).toBe('0')
  })

  it('empties "b" instead of writing zero', () => {
    expect(run(state({ a: '1', op: 'add', b: '7' }), { type: 'back' }).b).toBe('')
  })

  it('removes the operator when "b" is empty', () => {
    expect(run(state({ a: '1', op: 'add' }), { type: 'back' }).op).toBeNull()
  })

  it('clears after a result', () => {
    const next = run(state({ a: '9', result: '9', expr: '7 + 2', fresh: true }), { type: 'back' })
    expect(next).toMatchObject({ a: '0', result: null, expr: '', fresh: false })
  })
})

describe('clear', () => {
  it('resets the calculation but keeps the history', () => {
    const history = [{ expr: '7 + 2', result: '9' }]
    const next = run(state({ a: '9', op: 'add', b: '3', error: 'x', history }), { type: 'clear' })
    expect(next).toEqual({ ...initialState, history })
  })
})

describe('setOperator', () => {
  it('sets the pending operator', () => {
    expect(run(state({ a: '12' }), { type: 'setOperator', op: 'multiply' }).op).toBe('multiply')
  })

  it('replaces a pending operator', () => {
    expect(run(state({ a: '12', op: 'add' }), { type: 'setOperator', op: 'divide' }).op).toBe('divide')
  })

  it('continues from a result', () => {
    const next = run(state({ a: '9', result: '9', expr: '7 + 2', fresh: true }), { type: 'setOperator', op: 'add' })
    expect(next).toMatchObject({ a: '9', op: 'add', b: '', result: null, expr: '', fresh: false })
  })

  it('is ignored after an error', () => {
    const start = state({ error: 'division by zero', fresh: true })
    expect(run(start, { type: 'setOperator', op: 'add' })).toEqual(start)
  })

  it('is ignored while a square root is pending', () => {
    const start = state({ a: '', sqrt: true })
    expect(run(start, { type: 'setOperator', op: 'add' })).toEqual(start)
  })
})

describe('sqrt', () => {
  it('starts a new operand under √ instead of using the initial zero', () => {
    expect(run(initialState, { type: 'sqrt' })).toMatchObject({ a: '', sqrt: true })
  })

  it('lets the user type the number after √', () => {
    expect(run(initialState, { type: 'sqrt' }, ...digits('16'))).toMatchObject({ a: '16', sqrt: true })
  })

  it('applies to "b" when an operator is pending', () => {
    const next = run(state({ a: '5', op: 'add' }), { type: 'sqrt' }, ...digits('9'))
    expect(next).toMatchObject({ a: '5', op: 'add', b: '9', sqrt: true })
  })

  it('marks a number that was already typed', () => {
    expect(run(state({ a: '9' }), { type: 'sqrt' })).toMatchObject({ a: '9', sqrt: true })
  })

  it('starts over after a result', () => {
    const next = run(state({ a: '9', result: '9', expr: '7 + 2', fresh: true }), { type: 'sqrt' })
    expect(next).toMatchObject({ a: '', sqrt: true, result: null, expr: '', fresh: false })
  })

  it('starts over after an error', () => {
    const next = run(state({ error: 'division by zero', expr: '5 ÷ 0', fresh: true }), { type: 'sqrt' })
    expect(next).toMatchObject({ a: '', sqrt: true, error: null, expr: '' })
  })

  it('is removed by backspace when the operand is empty', () => {
    expect(run(initialState, { type: 'sqrt' }, { type: 'back' })).toMatchObject({ a: '0', sqrt: false })
    expect(run(state({ a: '5', op: 'add' }), { type: 'sqrt' }, { type: 'back' }))
      .toMatchObject({ op: 'add', b: '', sqrt: false })
  })

  it('keeps √ when backspace empties the typed number', () => {
    expect(run(state({ a: '7', sqrt: true }), { type: 'back' })).toMatchObject({ a: '', sqrt: true })
  })

  it('is reset by clear', () => {
    expect(run(state({ a: '9', sqrt: true }), { type: 'clear' }).sqrt).toBe(false)
  })
})

describe('reuse', () => {
  it('loads a history result as the current operand', () => {
    const next = run(state({ a: '5', op: 'add', b: '1', error: 'x', sqrt: true }), { type: 'reuse', value: '42' })
    expect(next).toMatchObject({ a: '42', op: null, b: '', result: null, error: null, fresh: false, sqrt: false })
  })
})

describe('while loading', () => {
  const loading = state({ a: '5', op: 'add', b: '3', loading: true })

  it.each<Action>([
    { type: 'digit', digit: '1' },
    { type: 'dot' },
    { type: 'sign' },
    { type: 'back' },
    { type: 'clear' },
    { type: 'setOperator', op: 'divide' },
    { type: 'sqrt' },
    { type: 'reuse', value: '42' }
  ])('ignores $type', (action) => {
    expect(calculatorReducer(loading, action)).toBe(loading)
  })
})

describe('request lifecycle', () => {
  const request = { operation: 'add' as const, a: 7, b: 2, expr: '7 + 2', target: 'a' as const }

  it('marks the calculator as loading', () => {
    expect(run(state({ error: 'old' }), { type: 'requestStarted' })).toMatchObject({ loading: true, error: null })
  })

  it('shows the result and stores it as "a" on success', () => {
    const next = run(
      state({ a: '7', op: 'add', b: '2', loading: true }),
      { type: 'requestSucceeded', request, result: '9' }
    )
    expect(next).toMatchObject({
      a: '9', op: null, b: '', result: '9', expr: '7 + 2', fresh: true, loading: false
    })
    expect(next.history).toEqual([{ expr: '7 + 2', result: '9' }])
  })

  it('replaces "b" without showing a result when the target is "b"', () => {
    const sqrt = { operation: 'sqrt' as const, a: 16, expr: '√(16)', target: 'b' as const }
    const next = run(
      state({ a: '5', op: 'add', b: '16', sqrt: true, loading: true }),
      { type: 'requestSucceeded', request: sqrt, result: '4' }
    )
    expect(next).toMatchObject({ a: '5', op: 'add', b: '4', result: null, sqrt: false, loading: false })
    expect(next.history).toEqual([{ expr: '√(16)', result: '4' }])
  })

  it('resolves a pending square root on "a"', () => {
    const sqrt = { operation: 'sqrt' as const, a: 16, expr: '√(16)', target: 'a' as const }
    const next = run(
      state({ a: '16', sqrt: true, loading: true }),
      { type: 'requestSucceeded', request: sqrt, result: '4' }
    )
    expect(next).toMatchObject({ a: '4', result: '4', expr: '√(16)', sqrt: false, fresh: true })
  })

  it('adds entries to the end of the history', () => {
    const history = [{ expr: '1 + 1', result: '2' }]
    const next = run(state({ history, loading: true }), { type: 'requestSucceeded', request, result: '9' })
    expect(next.history).toEqual([...history, { expr: '7 + 2', result: '9' }])
  })

  it('shows the error and drops the pending operator on failure', () => {
    const next = run(
      state({ a: '5', op: 'divide', b: '0', loading: true }),
      { type: 'requestFailed', request: { ...request, expr: '5 ÷ 0' }, message: 'division by zero' }
    )
    expect(next).toMatchObject({
      error: 'division by zero', expr: '5 ÷ 0', op: null, b: '', sqrt: false, fresh: true, loading: false
    })
    expect(next.history).toEqual([])
  })
})

describe('equalsRequest', () => {
  it('builds the request for the pending operation', () => {
    expect(equalsRequest(state({ a: '7', op: 'add', b: '2' }))).toEqual({
      operation: 'add', a: 7, b: 2, expr: '7 + 2', target: 'a'
    })
  })

  it.each([
    ['subtract', '−'],
    ['multiply', '×'],
    ['divide', '÷'],
    ['power', '^'],
    ['percentage', '% of']
  ] as const)('uses the %s symbol in the expression', (op, symbol) => {
    expect(equalsRequest(state({ a: '20', op, b: '5' }))?.expr).toBe(`20 ${symbol} 5`)
  })

  it('formats the operands in the expression', () => {
    expect(equalsRequest(state({ a: '0.50', op: 'add', b: '-2.' }))?.expr).toBe('0.5 + -2')
  })

  it.each([
    ['there is no operator', state({ a: '7' })],
    ['"b" is empty', state({ a: '7', op: 'add' })],
    ['"b" is only a minus sign', state({ a: '7', op: 'add', b: '-' })],
    ['a request is in flight', state({ a: '7', op: 'add', b: '2', loading: true })],
    ['"b" still has a pending square root', state({ a: '7', op: 'add', b: '9', sqrt: true })]
  ])('returns null when %s', (_, s) => {
    expect(equalsRequest(s)).toBeNull()
  })
})

describe('sqrtRequest', () => {
  it('targets "a" when there is no pending operator', () => {
    expect(sqrtRequest(state({ a: '16', sqrt: true }))).toEqual({
      operation: 'sqrt', a: 16, expr: '√(16)', target: 'a'
    })
  })

  it('targets "b" when an operator is pending', () => {
    expect(sqrtRequest(state({ a: '5', op: 'add', b: '9', sqrt: true }))).toEqual({
      operation: 'sqrt', a: 9, expr: '√(9)', target: 'b'
    })
  })

  it.each([
    ['there is no pending square root', state({ a: '16' })],
    ['the number after √ is empty', state({ a: '', sqrt: true })],
    ['the number after √ is only a minus sign', state({ a: '5', op: 'add', b: '-', sqrt: true })],
    ['a request is in flight', state({ a: '16', sqrt: true, loading: true })]
  ])('returns null when %s', (_, s) => {
    expect(sqrtRequest(s)).toBeNull()
  })
})
