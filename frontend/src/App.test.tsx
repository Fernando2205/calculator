import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

type Handler = (url: string, body: { a: number, b?: number }) => Promise<Response>

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const OPERATIONS: Record<string, (a: number, b: number) => number> = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
  power: (a, b) => a ** b,
  percentage: (a, b) => (a * b) / 100,
  sqrt: (a) => Math.sqrt(a)
}

/** Fake backend: answers the health check and computes every operation. */
const fakeBackend: Handler = async (url, { a, b = 0 }) => {
  const operation = url.split('/').pop()!
  if (operation === 'divide' && b === 0) {
    return json({ error: { code: 'DIVISION_BY_ZERO', message: 'division by zero' } }, 422)
  }
  return json({ operation, result: OPERATIONS[operation](a, b) })
}

let fetchMock: ReturnType<typeof vi.fn>

function serve (handler: Handler) {
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/healthz')) return json({ status: 'ok' })
    return handler(url, JSON.parse(String(init?.body)))
  })
  vi.stubGlobal('fetch', fetchMock)
}

const calculationCalls = () => fetchMock.mock.calls.filter(([url]) => !String(url).endsWith('/healthz'))

const display = () => screen.getByLabelText('display value')

async function press (...names: string[]) {
  for (const name of names) {
    await userEvent.click(screen.getByRole('button', { name }))
  }
}

beforeEach(() => {
  serve(fakeBackend)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('shows that the API is online', async () => {
    render(<App />)
    expect(await screen.findByText('api online')).toBeInTheDocument()
    expect(screen.getByText('localhost:8080')).toBeInTheDocument()
  })

  it('computes a calculation with the keypad and adds it to the history', async () => {
    render(<App />)

    await press('7', 'add', '2', 'equals')

    await waitFor(() => expect(display()).toHaveTextContent('9'))
    expect(screen.getByText('7 + 2 =')).toBeInTheDocument()
    expect(screen.getByText('✓ 200 ok')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /7 \+ 2.*9/ })).toBeInTheDocument()
    expect(calculationCalls()).toEqual([[
      'http://localhost:8080/api/v1/add',
      expect.objectContaining({ body: JSON.stringify({ a: 7, b: 2 }) })
    ]])
  })

  it('computes a calculation with the keyboard', async () => {
    render(<App />)

    await userEvent.keyboard('12*3{Enter}')

    await waitFor(() => expect(display()).toHaveTextContent('36'))
  })

  it('ignores keys pressed with Ctrl or Meta', async () => {
    render(<App />)

    await userEvent.keyboard('{Control>}7{/Control}{Meta>}8{/Meta}')

    expect(display()).toHaveTextContent('0')
  })

  it('chains operations by resolving the pending one first', async () => {
    render(<App />)

    await press('7', 'add', '2', 'multiply')
    await waitFor(() => expect(screen.getByText('9 ×')).toBeInTheDocument())
    await press('3', 'equals')

    await waitFor(() => expect(display()).toHaveTextContent('27'))
    expect(calculationCalls()).toHaveLength(2)
  })

  it('computes a square root', async () => {
    render(<App />)

    await press('1', '6', 'square root')

    await waitFor(() => expect(display()).toHaveTextContent('4'))
    expect(screen.getByText('√(16) =')).toBeInTheDocument()
  })

  it('formats results that have floating point noise', async () => {
    render(<App />)

    await press('decimal point', '1', 'add', 'decimal point', '2', 'equals')

    await waitFor(() => expect(display()).toHaveTextContent('0.3'))
    expect(display().textContent).toBe('0.3')
  })

  it('shows the error returned by the API', async () => {
    render(<App />)

    await press('5', 'divide', '0', 'equals')

    await waitFor(() => expect(display()).toHaveTextContent('Error'))
    expect(screen.getByText('✕ division by zero')).toBeInTheDocument()
    expect(screen.getByText('no calculations yet.')).toBeInTheDocument()
  })

  it('reports the API as offline when it cannot be reached', async () => {
    render(<App />)
    await screen.findByText('api online')
    serve(async () => { throw new TypeError('Failed to fetch') })

    await press('1', 'add', '1', 'equals')

    expect(await screen.findByText('✕ failed to reach api')).toBeInTheDocument()
    expect(screen.getByText('api offline')).toBeInTheDocument()
  })

  it('reuses a result from the history', async () => {
    render(<App />)
    await press('7', 'add', '2', 'equals')
    const row = await screen.findByRole('button', { name: /7 \+ 2/ })
    await press('all clear')
    expect(display()).toHaveTextContent('0')

    await userEvent.click(row)

    expect(display()).toHaveTextContent('9')
  })

  it('ignores input while a calculation is in flight', async () => {
    let respond: (response: Response) => void = () => {}
    render(<App />)
    serve(() => new Promise((resolve) => { respond = resolve }))

    await press('7', 'add', '2', 'equals')
    expect(screen.getByText('~ $ computing…')).toBeInTheDocument()
    await press('5', 'equals')
    expect(display()).toHaveTextContent('2')

    respond(json({ operation: 'add', result: 9 }))

    await waitFor(() => expect(display()).toHaveTextContent('9'))
    expect(calculationCalls()).toHaveLength(1)
  })

  it('ignores keys that are not shortcuts', async () => {
    render(<App />)

    await userEvent.keyboard('7a{ArrowLeft}')

    expect(display()).toHaveTextContent('7')
  })

  it('does not call the API when the calculation is incomplete', async () => {
    render(<App />)

    await press('equals', '7', 'add', 'equals', 'toggle sign', 'square root')

    expect(calculationCalls()).toHaveLength(0)
  })

  it('stops a chained operation when the pending one fails', async () => {
    render(<App />)

    await press('5', 'divide', '0', 'multiply')

    await waitFor(() => expect(display()).toHaveTextContent('Error'))
    expect(screen.getByRole('button', { name: 'multiply' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('applies the square root to the second operand', async () => {
    render(<App />)

    await press('5', 'add', '9', 'square root')
    await waitFor(() => expect(display()).toHaveTextContent('3'))
    await press('equals')

    await waitFor(() => expect(display()).toHaveTextContent('8'))
    expect(screen.getByText('5 + 3 =')).toBeInTheDocument()
  })

  it('ignores history clicks while a calculation is in flight', async () => {
    render(<App />)
    await press('7', 'add', '2', 'equals')
    const row = await screen.findByRole('button', { name: /7 \+ 2/ })
    serve(() => new Promise(() => {}))

    await press('add', '1', 'equals')
    await userEvent.click(row)

    expect(screen.getByText('9 +')).toBeInTheDocument()
    expect(display()).toHaveTextContent('1')
  })

  it('lists the history newest first', async () => {
    render(<App />)
    await press('1', 'add', '1', 'equals')
    await screen.findByText('1 + 1 =')
    await press('multiply', '3', 'equals')
    await screen.findByText('2 × 3 =')

    const rows = within(screen.getByRole('list')).getAllByRole('button')
    expect(rows.map((row) => row.textContent)).toEqual(['022 × 36', '011 + 12'])
  })
})
