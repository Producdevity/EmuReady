import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarkdownRenderer } from './MarkdownRenderer'

function getRenderedElement(element: Element | null): HTMLElement {
  if (element instanceof HTMLElement) return element

  throw new Error('Expected MarkdownRenderer to render an element')
}

describe('MarkdownRenderer', () => {
  it('renders plain text without markdown wrapping when fallback is enabled', () => {
    const content = 'First line\nSecond line'
    const { container } = render(<MarkdownRenderer content={content} fallbackToPlainText />)

    const wrapper = getRenderedElement(container.firstElementChild)

    expect(wrapper.textContent).toBe(content)
    expect(wrapper).toHaveClass('whitespace-pre-wrap')
    expect(container.querySelector('p')).not.toBeInTheDocument()
  })

  it('parses content when markdown syntax is present', () => {
    render(<MarkdownRenderer content="Use **bold** and `code`" fallbackToPlainText />)

    expect(screen.getByText('bold').tagName).toBe('STRONG')
    expect(screen.getByText('code').tagName).toBe('CODE')
  })
})
