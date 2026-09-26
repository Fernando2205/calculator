import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import History from './History'

const entries = [
  { expr: '7 + 2', result: '9' },
  { expr: '9 × 3', result: '27' }
]

describe('History', () => {
  it('shows an empty state', () => {
    render(<History entries={[]} onReuse={() => {}} />)
    expect(screen.getByText('no calculations yet.')).toBeInTheDocument()
  })

  it('lists the newest calculation first with its number', () => {
    render(<History entries={entries} onReuse={() => {}} />)

    const rows = screen.getAllByRole('button')
    expect(within(rows[0]).getByText('02')).toBeInTheDocument()
    expect(rows[0]).toHaveTextContent('9 × 3')
    expect(rows[0]).toHaveTextContent('27')
    expect(rows[1]).toHaveTextContent('01')
    expect(rows[1]).toHaveTextContent('7 + 2')
  })

  it('reuses the result of the clicked row', async () => {
    const onReuse = vi.fn()
    render(<History entries={entries} onReuse={onReuse} />)

    await userEvent.click(screen.getByRole('button', { name: /7 \+ 2/ }))

    expect(onReuse).toHaveBeenCalledWith('9')
  })
})
