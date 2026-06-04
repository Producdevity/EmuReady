import { render, waitFor } from '@testing-library/react'
import { act, type PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TranslatableMarkdown } from './TranslatableMarkdown'

interface MotionProps extends PropsWithChildren {
  className?: string
}

interface UseTranslationOptions {
  enabled?: boolean
}

const useTranslationMock = vi.hoisted(() =>
  vi.fn((content: string, _options?: UseTranslationOptions) => ({
    displayedContent: content,
    showTranslated: false,
    isTranslating: false,
    showTranslationOption: false,
    toggleTranslation: vi.fn(),
    getButtonLabel: () => 'Translate (BETA)',
    getTranslationInfo: () => 'Translation available',
  })),
)

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: MotionProps) => <div className={props.className}>{props.children}</div>,
  },
  AnimatePresence: (props: PropsWithChildren) => props.children,
}))

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: useTranslationMock,
}))

const intersectionObservers: MockIntersectionObserver[] = []

function createIntersectionEntry(isIntersecting: boolean): IntersectionObserverEntry {
  const rect = new DOMRect(0, 0, 0, 0)

  return {
    boundingClientRect: rect,
    intersectionRatio: isIntersecting ? 1 : 0,
    intersectionRect: rect,
    isIntersecting,
    rootBounds: null,
    target: document.createElement('div'),
    time: 0,
  }
}

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string
  readonly thresholds: readonly number[] = []

  private readonly callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback
    this.rootMargin = options?.rootMargin ?? '0px'
    intersectionObservers.push(this)
  }

  disconnect = vi.fn()
  observe = vi.fn()
  takeRecords = vi.fn(() => [])
  unobserve = vi.fn()

  trigger(isIntersecting: boolean) {
    this.callback([createIntersectionEntry(isIntersecting)], this)
  }
}

function getRenderedElement(element: Element | null): HTMLElement {
  if (element instanceof HTMLElement) return element

  throw new Error('Expected TranslatableMarkdown to render an element')
}

describe('TranslatableMarkdown', () => {
  beforeEach(() => {
    useTranslationMock.mockClear()
    intersectionObservers.length = 0
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('preserves plain text newlines when requested', () => {
    const content = 'First line\nSecond line'
    const { container } = render(<TranslatableMarkdown content={content} preserveWhitespace />)

    const proseWrapper = getRenderedElement(container.querySelector('.prose'))

    expect(proseWrapper.textContent).toBe(content)
    expect(proseWrapper).toHaveClass('whitespace-pre-wrap')
    expect(proseWrapper.querySelector('p')).not.toBeInTheDocument()
  })

  it('enables translation detection after the markdown reaches the viewport', async () => {
    const content = 'Este texto necesita traduccion'

    render(<TranslatableMarkdown content={content} />)

    expect(useTranslationMock).toHaveBeenLastCalledWith(content, { enabled: false })

    await waitFor(() => expect(intersectionObservers).toHaveLength(1))
    act(() => {
      intersectionObservers[0]?.trigger(true)
    })

    await waitFor(() =>
      expect(useTranslationMock).toHaveBeenLastCalledWith(content, { enabled: true }),
    )
  })
})
