import { describe, expect, it } from 'vitest'
import { formatNumber } from './format'

describe('formatNumber', () => {
  it.each([
    ['an integer', 9, '9'],
    ['a negative decimal', -2.5, '-2.5'],
    ['zero', 0, '0'],
    ['a float rounding error', 0.1 + 0.2, '0.3'],
    ['a periodic decimal', 1 / 3, '0.333333333333'],
    ['a long integer that fits in 16 chars', 1234567890123456, '1234567890120000'],
    ['a small number', 0.000000123, '1.23e-7']
  ])('formats %s', (_, input, want) => {
    expect(formatNumber(input)).toBe(want)
  })

  it('switches to exponential notation when the result is longer than 16 chars', () => {
    expect(formatNumber(1.23456789012345e17)).toBe('1.23456789e+17')
  })

  it('trims trailing zeros from the exponential mantissa', () => {
    expect(formatNumber(1e17)).toBe('1e+17')
  })
})
