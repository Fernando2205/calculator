import { afterEach, describe, expect, it, vi } from 'vitest'
import { animate, flashKey } from './motion'

function mockReducedMotion (reduce: boolean) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduce })))
}

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('animate', () => {
  it('runs the animation on the element', () => {
    mockReducedMotion(false)
    const el = document.createElement('div')
    el.animate = vi.fn()

    animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 100 })

    expect(el.animate).toHaveBeenCalledWith([{ opacity: 0 }, { opacity: 1 }], { duration: 100 })
  })

  it('does nothing when the user prefers reduced motion', () => {
    mockReducedMotion(true)
    const el = document.createElement('div')
    el.animate = vi.fn()

    animate(el, [{ opacity: 0 }], { duration: 100 })

    expect(el.animate).not.toHaveBeenCalled()
  })

  it('does nothing without an element or Web Animations support', () => {
    mockReducedMotion(false)
    expect(() => animate(null, [], {})).not.toThrow()
    expect(() => animate(document.createElement('div'), [], {})).not.toThrow()
  })
})

describe('flashKey', () => {
  it('animates the on-screen key with the matching data-k attribute', () => {
    mockReducedMotion(false)
    document.body.innerHTML = '<button data-k="d7">7</button>'
    const key = document.querySelector<HTMLElement>('[data-k="d7"]')!
    key.animate = vi.fn()

    flashKey('d7')

    expect(key.animate).toHaveBeenCalledOnce()
  })
})
