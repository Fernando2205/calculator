import { describe, expect, it } from 'vitest'
import { keyFromKeyboard } from './keys'

describe('keyFromKeyboard', () => {
  it.each([
    ['0', 'd0'],
    ['7', 'd7'],
    ['.', 'dot'],
    [',', 'dot'],
    ['+', 'add'],
    ['-', 'subtract'],
    ['*', 'multiply'],
    ['x', 'multiply'],
    ['/', 'divide'],
    ['^', 'power'],
    // "^" is a dead key on Spanish layouts, so "p" is an alternative shortcut.
    ['p', 'power'],
    ['%', 'percentage'],
    ['s', 'sqrt'],
    ['Enter', 'equals'],
    ['=', 'equals'],
    ['Backspace', 'back'],
    ['Escape', 'clear']
  ])('maps "%s" to %s', (key, want) => {
    expect(keyFromKeyboard(key)).toBe(want)
  })

  it.each(['a', 'Tab', 'ArrowLeft', 'F5', ' ', 'Dead'])('ignores "%s"', (key) => {
    expect(keyFromKeyboard(key)).toBeNull()
  })
})
