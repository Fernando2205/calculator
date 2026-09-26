import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StatusPill from './StatusPill'

describe('StatusPill', () => {
  it.each([
    ['online', 'api online'],
    ['offline', 'api offline'],
    ['checking', 'checking api']
  ] as const)('shows the %s label', (status, label) => {
    render(<StatusPill status={status} />)
    expect(screen.getByRole('status')).toHaveTextContent(label)
  })
})
