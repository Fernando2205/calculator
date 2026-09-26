import type { BinaryOperation } from '../api/client'

export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

/** Identifier of every calculator key, shared by the keypad and the keyboard. */
export type KeyId =
  | `d${Digit}`
  | BinaryOperation
  | 'dot'
  | 'sign'
  | 'back'
  | 'clear'
  | 'sqrt'
  | 'equals'

const KEYBOARD: Record<string, KeyId> = {
  '.': 'dot',
  ',': 'dot',
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  x: 'multiply',
  '/': 'divide',
  '^': 'power',
  '%': 'percentage',
  s: 'sqrt',
  Enter: 'equals',
  '=': 'equals',
  Backspace: 'back',
  Escape: 'clear'
}

/** Maps a KeyboardEvent.key value to a calculator key, or null if unused. */
export function keyFromKeyboard (key: string): KeyId | null {
  if (/^[0-9]$/.test(key)) return `d${key as Digit}`
  return KEYBOARD[key] ?? null
}
