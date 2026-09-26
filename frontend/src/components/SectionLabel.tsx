interface SectionLabelProps {
  left: string
  right: string
}

/** Small "01 / calculator · keyboard ready" line above each block. */
export default function SectionLabel ({ left, right }: SectionLabelProps) {
  return (
    <div className='flex flex-wrap justify-between gap-x-3 gap-y-1 text-[12px] text-mut'>
      <span>{left}</span>
      <span>{right}</span>
    </div>
  )
}
