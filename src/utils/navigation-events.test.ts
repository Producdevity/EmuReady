import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isAnchorNavigationTarget,
  openInNewTab,
  shouldOpenInNewTab,
  type NavigationClickEvent,
} from './navigation-events'

function createNavigationEvent(
  overrides: Partial<NavigationClickEvent> = {},
): NavigationClickEvent {
  return {
    button: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    target: document.createElement('div'),
    ...overrides,
  }
}

describe('navigation-events', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not request a new tab for a normal primary click', () => {
    expect(shouldOpenInNewTab(createNavigationEvent())).toBe(false)
  })

  it.each([
    ['Ctrl-click', { ctrlKey: true }],
    ['Cmd-click', { metaKey: true }],
    ['Shift-click', { shiftKey: true }],
    ['middle-click', { button: 1 }],
  ])('requests a new tab for %s', (_label, overrides) => {
    expect(shouldOpenInNewTab(createNavigationEvent(overrides))).toBe(true)
  })

  it('detects clicks from inside anchor elements', () => {
    const anchor = document.createElement('a')
    anchor.href = '/listings/123'

    const child = document.createElement('span')
    anchor.appendChild(child)

    expect(isAnchorNavigationTarget(createNavigationEvent({ target: child }))).toBe(true)
  })

  it('does not treat non-anchor targets as anchor navigation', () => {
    expect(isAnchorNavigationTarget(createNavigationEvent())).toBe(false)
  })

  it('opens URLs in a new tab without passing opener access', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    openInNewTab('/listings/123')

    expect(openSpy).toHaveBeenCalledWith('/listings/123', '_blank', 'noopener,noreferrer')
  })
})
