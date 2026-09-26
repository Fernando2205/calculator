import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { DisplayModel } from '../calculator/display'
import Display from './Display'

const idle: DisplayModel = {
  expression: '',
  value: '0',
  status: { tone: 'none', text: '' },
  isError: false
}

describe('Display', () => {
  it('shows the expression, the value and the status', () => {
    render(
      <Display
        model={{ expression: '7 + 2 =', value: '9', status: { tone: 'ok', text: '✓ 200 ok' }, isError: false }}
        loading={false}
      />
    )

    expect(screen.getByText('7 + 2 =')).toBeInTheDocument()
    expect(screen.getByLabelText('display value')).toHaveTextContent('9')
    expect(screen.getByText('✓ 200 ok')).toBeInTheDocument()
  })

  it('marks the value as an error', () => {
    render(
      <Display
        model={{ expression: '5 ÷ 0', value: 'Error', status: { tone: 'error', text: '✕ division by zero' }, isError: true }}
        loading={false}
      />
    )

    expect(screen.getByLabelText('display value')).toHaveClass('text-err')
    expect(screen.getByText('✕ division by zero')).toHaveClass('text-err')
  })

  it('shrinks the font for long values', () => {
    render(<Display model={{ ...idle, value: '12345678901234' }} loading={false} />)
    expect(screen.getByLabelText('display value')).toHaveClass('text-[28px]')
  })

  it('shows the loading bar only while loading', () => {
    const { rerender } = render(<Display model={idle} loading={false} />)
    expect(screen.queryByTestId('loading-bar')).not.toBeInTheDocument()

    rerender(<Display model={idle} loading />)
    expect(screen.getByTestId('loading-bar')).toBeInTheDocument()
  })
})
