import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount rendered components between tests (Vitest globals are disabled,
// so Testing Library cannot register this hook automatically).
afterEach(() => {
  cleanup()
})
