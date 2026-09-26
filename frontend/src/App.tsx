import { API_HOST } from './api/client'
import Display from './components/Display'
import History from './components/History'
import Keypad from './components/Keypad'
import SectionLabel from './components/SectionLabel'
import StatusPill from './components/StatusPill'
import { useApiHealth } from './hooks/useApiHealth'
import { useCalculator } from './hooks/useCalculator'
import { useKeyboard } from './hooks/useKeyboard'

export default function App () {
  const [apiStatus, setApiStatus] = useApiHealth()
  const { state, display, press, reuse } = useCalculator(setApiStatus)
  useKeyboard(press)

  return (
    <div className='relative flex min-h-screen flex-col overflow-hidden bg-bg font-mono text-[14px] text-fg'>
      {/* Decorative background: drifting accent glow + fading dot grid. */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -top-[20vh] -left-[10vw] size-[70vw] max-h-[900px] max-w-[900px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--color-acc)_16%,transparent),transparent)] blur-[20px] motion-safe:animate-drift'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(color-mix(in_oklch,var(--color-fg)_7%,transparent)_1px,transparent_1px)] bg-size-[22px_22px] mask-[linear-gradient(180deg,#000,transparent_70%)]'
      />

      <main className='relative z-1 mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-9 px-[clamp(16px,4vw,48px)] py-[clamp(24px,5vw,56px)]'>
        <header className='flex flex-col gap-3 motion-safe:animate-rise'>
          <div className='flex flex-wrap items-center justify-between gap-3 text-[13px] text-mut'>
            <span>
              ~ $ ./calc --remote <span className='text-acc'>{API_HOST}</span>
              <span aria-hidden='true' className='text-acc motion-safe:animate-blink'>▍</span>
            </span>
            <StatusPill status={apiStatus} />
          </div>
          <h1 className='m-0 font-display text-[clamp(28px,5vw,48px)] font-semibold leading-[1.05] tracking-[-0.02em] text-pretty'>
            Calculator, computed server-side.
          </h1>
        </header>

        <div className='flex flex-wrap items-start gap-7'>
          <section
            aria-label='calculator'
            className='flex max-w-[460px] flex-[1_1_340px] flex-col gap-3 motion-safe:animate-rise motion-safe:[animation-delay:100ms]'
          >
            <SectionLabel left='01 / calculator' right='keyboard ready' />
            <div className='flex flex-col gap-3.5 rounded-xl border border-line bg-linear-to-b from-keyhi to-surf to-40% p-3.5 shadow-card'>
              <Display model={display} loading={state.loading} />
              <Keypad activeOperator={state.op} onPress={press} />
            </div>
            <p className='m-0 text-[12px] leading-[1.7] text-mut pointer-coarse:hidden'>
              0–9 · + − * / · p power · s sqrt · % percent · enter · esc
            </p>
          </section>

          <section
            aria-label='history'
            className='flex min-w-0 flex-[1_1_320px] flex-col gap-3 motion-safe:animate-rise motion-safe:[animation-delay:200ms]'
          >
            <SectionLabel left='02 / history' right='click to reuse' />
            <History entries={state.history} onReuse={reuse} />
          </section>
        </div>
      </main>

      <footer className='relative z-1 flex flex-wrap justify-between gap-3 border-t border-line px-[clamp(16px,4vw,48px)] py-[18px] text-[12px] text-mut'>
        <span>© 2026 Delio Fernando Palacios</span>
        <span>take-home · sezzle</span>
      </footer>
    </div>
  )
}
