import type { ReactNode } from 'react'
import type { KeyId } from '../lib/keys'

export type KeyVariant = 'digit' | 'operator' | 'danger' | 'plain' | 'equals'

const BASE = 'h-14 cursor-pointer rounded-lg border font-mono font-medium [transition:transform_.12s_ease,border-color_.2s_ease,filter_.2s_ease,box-shadow_.2s_ease] active:scale-95'

const VARIANTS: Record<KeyVariant, string> = {
  digit: 'border-line bg-linear-to-b from-keyhi to-key text-[19px] text-fg shadow-key hover:border-mut',
  operator: 'bg-transparent text-acc hover:border-acc',
  danger: 'border-line bg-transparent text-[15px] text-err hover:border-err',
  plain: 'border-line bg-transparent text-[17px] text-fg hover:border-mut',
  equals: 'col-span-3 flex items-center justify-center gap-2.5 rounded-md border-acc bg-acc text-[20px] font-bold text-ink shadow-equals hover:brightness-108'
}

interface KeyProps {
  id: KeyId
  label: ReactNode
  variant: KeyVariant
  /** Accessible name when the label is a glyph, e.g. "backspace" for ⌫. */
  ariaLabel?: string
  /** Operators only: whether this operator is pending. */
  active?: boolean
  className?: string
  onPress: (id: KeyId) => void
}

export default function Key ({ id, label, variant, ariaLabel, active = false, className = '', onPress }: KeyProps) {
  const isOperator = variant === 'operator'
  const operatorState = isOperator ? (active ? 'border-acc shadow-op-active' : 'border-line') : ''

  return (
    <button
      type='button'
      data-k={id}
      aria-label={ariaLabel}
      aria-pressed={isOperator ? active : undefined}
      title={ariaLabel}
      className={`${BASE} ${VARIANTS[variant]} ${operatorState} ${className}`}
      onClick={() => onPress(id)}
    >
      {label}
    </button>
  )
}
