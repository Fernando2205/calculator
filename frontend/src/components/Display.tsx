import { useEffect, useRef } from 'react'
import { type DisplayModel, type ValueSize, valueSize } from '../calculator/display'
import { animate } from '../lib/motion'

const SIZES: Record<ValueSize, string> = {
  lg: 'text-[48px]',
  md: 'text-[38px]',
  sm: 'text-[28px]'
}

const TONES = {
  none: 'text-mut',
  muted: 'text-mut',
  ok: 'text-acc',
  error: 'text-err'
} as const

type Kind = 'typing' | 'result' | 'error'

interface DisplayProps {
  model: DisplayModel
  loading: boolean
}

export default function Display ({ model, loading }: DisplayProps) {
  const valueRef = useRef<HTMLOutputElement>(null)
  const kind: Kind = model.isError ? 'error' : model.status.tone === 'ok' ? 'result' : 'typing'
  const previous = useRef({ kind, value: model.value })

  // Animate the main value when it changes: shake on a new error, reveal a
  // new result, and give typed digits a subtle nudge.
  useEffect(() => {
    const before = previous.current
    previous.current = { kind, value: model.value }
    const el = valueRef.current

    if (kind === 'error' && before.kind !== 'error') {
      animate(el, [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(5px)' },
        { transform: 'translateX(-3px)' },
        { transform: 'none' }
      ], { duration: 380, easing: 'ease-out' })
    } else if (kind === 'result' && (before.kind !== 'result' || before.value !== model.value)) {
      animate(el, [
        { opacity: 0, transform: 'translateY(10px)', filter: 'blur(4px)' },
        { opacity: 1, transform: 'none', filter: 'none' }
      ], { duration: 360, easing: 'cubic-bezier(.2,.7,.2,1)' })
    } else if (kind === 'typing' && before.value !== model.value) {
      animate(el, [
        { opacity: 0.4, transform: 'translateY(3px)' },
        { opacity: 1, transform: 'none' }
      ], { duration: 140, easing: 'ease-out' })
    }
  }, [kind, model.value])

  return (
    <div className='relative flex min-h-[132px] flex-col items-end justify-end gap-1.5 overflow-hidden rounded-lg border border-line bg-bg px-4 pt-4 pb-3.5 shadow-display'>
      {loading && (
        <div data-testid='loading-bar' className='absolute inset-x-0 bottom-0 h-0.5 overflow-hidden'>
          <div className='h-full w-2/5 bg-linear-to-r from-transparent via-acc to-transparent motion-safe:animate-scan' />
        </div>
      )}
      <div className='min-h-5 max-w-full truncate text-[14px] text-mut'>{model.expression}</div>
      <output
        ref={valueRef}
        aria-label='display value'
        aria-live='polite'
        className={`max-w-full text-right font-display font-medium leading-[1.1] tracking-[-0.02em] wrap-anywhere transition-[font-size] duration-200 ${SIZES[valueSize(model.value)]} ${model.isError ? 'text-err' : 'text-fg'}`}
      >
        {model.value}
      </output>
      <div className={`flex min-h-4 items-center gap-1.5 text-[12px] ${TONES[model.status.tone]}`}>
        {model.status.text}
      </div>
    </div>
  )
}
