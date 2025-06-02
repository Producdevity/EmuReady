import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'
import { cleanup, configure } from '@testing-library/react'
import { prettyDOM } from '@testing-library/dom'

// This file is imported in vitest.config.mts
// It sets up the jest-dom matchers for better assertions in tests

beforeEach(() => {
  // Clear all mocks and timers before each test
  vi.clearAllMocks()
  vi.clearAllTimers()
})

afterEach(() => {
  // Clean up React components
  cleanup()
  
  // Clean up any remaining timers
  vi.clearAllTimers()
  vi.clearAllMocks()
})

// Mock ResizeObserver for components that use it
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Optimize React Testing Library
configure({
  // Reduce async utils timeout for faster tests
  asyncUtilTimeout: 5000,
  // Better error handling for clearer test failures
  getElementError: (message, container) => {
    const prettifiedDOM = prettyDOM(container)
    return new Error(
      [
        message,
        "Here's the DOM tree at the time of failure:",
        prettifiedDOM,
      ].filter(Boolean).join('\n\n')
    )
  },
})
