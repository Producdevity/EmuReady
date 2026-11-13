import { fireEvent, render, screen } from '@testing-library/react'
import { type ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { OptimizedImage } from './OptimizedImage'

vi.mock('./ImageRenderer', () => ({
  ImageRenderer: (props: ComponentProps<'img'>) => (
    <img
      src={props.src}
      alt={props.alt}
      className={props.className}
      onLoad={props.onLoad}
      onError={props.onError}
    />
  ),
}))

describe('OptimizedImage source changes', () => {
  it('clears a previous failure when a new image is selected', () => {
    const view = render(<OptimizedImage src="https://example.com/first.png" alt="Cover" />)
    fireEvent.error(screen.getByAltText('Cover'))
    expect(screen.getByAltText('Cover')).toHaveAttribute('src', '/placeholder/game.svg')

    view.rerender(<OptimizedImage src="https://example.com/second.png" alt="Cover" />)

    expect(screen.getByAltText('Cover')).toHaveAttribute('src', 'https://example.com/second.png')
    expect(screen.getByAltText('Cover')).toHaveClass('opacity-0')
    fireEvent.load(screen.getByAltText('Cover'))
    expect(screen.getByAltText('Cover')).toHaveClass('opacity-100')
  })

  it('retries the primary image when the fallback changes', () => {
    const view = render(
      <OptimizedImage src="https://example.com/cover.png" alt="Cover" fallbackSrc="/first.svg" />,
    )
    fireEvent.error(screen.getByAltText('Cover'))
    view.rerender(
      <OptimizedImage src="https://example.com/cover.png" alt="Cover" fallbackSrc="/second.svg" />,
    )
    expect(screen.getByAltText('Cover')).toHaveAttribute('src', 'https://example.com/cover.png')
    fireEvent.error(screen.getByAltText('Cover'))
    expect(screen.getByAltText('Cover')).toHaveAttribute('src', '/second.svg')
  })
})
