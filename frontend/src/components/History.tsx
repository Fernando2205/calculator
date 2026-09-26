import type { HistoryEntry } from '../calculator/reducer'

interface HistoryProps {
  entries: HistoryEntry[]
  onReuse: (result: string) => void
}

export default function History ({ entries, onReuse }: HistoryProps) {
  if (entries.length === 0) {
    return <p className='m-0 border-t border-line py-4 text-[13px] text-mut'>no calculations yet.</p>
  }

  // Newest first; the numbers keep the order in which calculations were made.
  const rows = entries
    .map((entry, i) => ({ ...entry, num: String(i + 1).padStart(2, '0') }))
    .reverse()

  return (
    <ol className='m-0 flex list-none flex-col border-t border-line p-0'>
      {rows.map((row) => (
        <li key={row.num}>
          <button
            type='button'
            className='flex w-full shrink-0 cursor-pointer items-baseline justify-between gap-4 border-b border-line bg-transparent px-0.5 py-3 text-left text-[13px] text-fg [transition:color_.2s_ease,padding_.25s_ease] hover:pl-2 hover:text-acc motion-safe:animate-slide-in'
            onClick={() => onReuse(row.result)}
          >
            <span className='flex min-w-0 flex-1 gap-2.5 text-mut'>
              <span className='shrink-0 opacity-60'>{row.num}</span>
              <span className='min-w-0 wrap-break-word'>{row.expr}</span>
            </span>
            <span className='whitespace-nowrap font-display text-[17px] font-medium'>{row.result}</span>
          </button>
        </li>
      ))}
    </ol>
  )
}
