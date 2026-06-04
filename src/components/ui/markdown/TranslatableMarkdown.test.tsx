import { render } from '@testing-library/react'
import { type PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TranslatableMarkdown } from './TranslatableMarkdown'

interface MotionProps extends PropsWithChildren {
  className?: string
}

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: MotionProps) => <div className={props.className}>{props.children}</div>,
  },
  AnimatePresence: (props: PropsWithChildren) => props.children,
}))

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: (content: string) => ({
    displayedContent: content,
    showTranslated: false,
    isTranslating: false,
    showTranslationOption: false,
    toggleTranslation: vi.fn(),
    getButtonLabel: () => 'Translate (BETA)',
    getTranslationInfo: () => 'Translation available',
  }),
}))

function getRenderedElement(element: Element | null): HTMLElement {
  if (element instanceof HTMLElement) return element

  throw new Error('Expected TranslatableMarkdown to render an element')
}

describe('TranslatableMarkdown', () => {
  it('preserves plain text newlines when requested', () => {
    const content = 'First line\nSecond line'
    const { container } = render(<TranslatableMarkdown content={content} preserveWhitespace />)

    const proseWrapper = getRenderedElement(container.querySelector('.prose'))

    expect(proseWrapper.textContent).toBe(content)
    expect(proseWrapper).toHaveClass('whitespace-pre-wrap')
    expect(proseWrapper.querySelector('p')).not.toBeInTheDocument()
  })
})
