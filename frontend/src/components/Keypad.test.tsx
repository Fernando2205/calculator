import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Keypad from './Keypad'

describe('Keypad', () => {
  it('renders the 22 keys in the design order', () => {
    render(<Keypad activeOperator={null} onPress={() => {}} />)

    const labels = screen.getAllByRole('button').map((key) => key.getAttribute('data-k'))
    expect(labels).toEqual([
      'clear', 'back', 'sqrt', 'power',
      'd7', 'd8', 'd9', 'divide',
      'd4', 'd5', 'd6', 'multiply',
      'd1', 'd2', 'd3', 'subtract',
      'd0', 'dot', 'percentage', 'add',
      'sign', 'equals'
    ])
  })

  it.each([
    ['7', 'd7'],
    ['all clear', 'clear'],
    ['backspace', 'back'],
    ['square root', 'sqrt'],
    ['power', 'power'],
    ['divide', 'divide'],
    ['percentage', 'percentage'],
    ['toggle sign', 'sign'],
    ['equals', 'equals']
  ])('reports a click on "%s" as %s', async (name, id) => {
    const onPress = vi.fn()
    render(<Keypad activeOperator={null} onPress={onPress} />)

    await userEvent.click(screen.getByRole('button', { name }))

    expect(onPress).toHaveBeenCalledWith(id)
  })

  it('highlights the active operator', () => {
    render(<Keypad activeOperator='multiply' onPress={() => {}} />)

    expect(screen.getByRole('button', { name: 'multiply' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'add' })).toHaveAttribute('aria-pressed', 'false')
  })
})
