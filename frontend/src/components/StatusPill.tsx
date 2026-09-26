import type { ApiStatus } from '../api/client'

const LABELS: Record<ApiStatus, string> = {
  checking: 'checking api',
  online: 'api online',
  offline: 'api offline'
}

const DOT_COLORS: Record<ApiStatus, string> = {
  checking: 'bg-mut',
  online: 'bg-acc',
  offline: 'bg-err'
}

interface StatusPillProps {
  status: ApiStatus
}

export default function StatusPill ({ status }: StatusPillProps) {
  const dot = DOT_COLORS[status]
  return (
    <span
      role='status'
      className='flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-line bg-surf/70 px-[11px] py-[5px] text-[12px] text-fg backdrop-blur-[6px]'
    >
      <span className='relative size-[7px]' aria-hidden='true'>
        <span className={`absolute inset-0 rounded-full motion-safe:animate-ping ${dot}`} />
        <span className={`absolute inset-0 rounded-full ${dot}`} />
      </span>
      {LABELS[status]}
    </span>
  )
}
