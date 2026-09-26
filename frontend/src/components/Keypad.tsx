import type { BinaryOperation } from '../api/client'
import type { Digit, KeyId } from '../lib/keys'
import Key, { type KeyVariant } from './Key'

interface KeyDef {
  id: KeyId
  label: string
  variant: KeyVariant
  ariaLabel?: string
  className?: string
}

const digit = (n: Digit): KeyDef => ({ id: `d${n}`, label: n, variant: 'digit' })

const operator = (id: BinaryOperation | 'sqrt', label: string, ariaLabel: string, size: string): KeyDef =>
  ({ id, label, variant: 'operator', ariaLabel, className: size })

// Keys in reading order (4 per row), as in the design. "=" is added last.
const KEYS: KeyDef[] = [
  { id: 'clear', label: 'AC', variant: 'danger', ariaLabel: 'all clear' },
  { id: 'back', label: '⌫', variant: 'plain', ariaLabel: 'backspace' },
  operator('sqrt', '√x', 'square root', 'text-[17px]'),
  operator('power', 'xʸ', 'power', 'text-[17px]'),
  digit('7'), digit('8'), digit('9'),
  operator('divide', '÷', 'divide', 'text-[20px]'),
  digit('4'), digit('5'), digit('6'),
  operator('multiply', '×', 'multiply', 'text-[20px]'),
  digit('1'), digit('2'), digit('3'),
  operator('subtract', '−', 'subtract', 'text-[20px]'),
  digit('0'),
  { id: 'dot', label: '.', variant: 'digit', ariaLabel: 'decimal point' },
  operator('percentage', '%', 'percentage', 'text-[17px]'),
  operator('add', '+', 'add', 'text-[20px]'),
  { id: 'sign', label: '±', variant: 'plain', ariaLabel: 'toggle sign' }
]

interface KeypadProps {
  activeOperator: BinaryOperation | null
  onPress: (id: KeyId) => void
}

export default function Keypad ({ activeOperator, onPress }: KeypadProps) {
  return (
    <div className='grid grid-cols-4 gap-2'>
      {KEYS.map((key) => (
        <Key key={key.id} {...key} active={key.id === activeOperator} onPress={onPress} />
      ))}
      <Key
        id='equals'
        variant='equals'
        ariaLabel='equals'
        label={<>=<span className='text-[12px] font-medium opacity-80'>enter</span></>}
        onPress={onPress}
      />
    </div>
  )
}
