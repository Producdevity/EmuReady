import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GameImage } from './GameImage'
import type { ImgHTMLAttributes } from 'react'

vi.mock('next/image', () => ({
  default: (
    props: ImgHTMLAttributes<HTMLImageElement> & {
      fill?: boolean
      priority?: boolean
      unoptimized?: boolean
    },
  ) => {
    const { fill: _fill, priority: _priority, unoptimized: _unoptimized, ...imgProps } = props
    return <img alt={String(imgProps.alt ?? '')} {...imgProps} />
  },
}))

const game = {
  id: 'game-1',
  title: 'Wide Cover Game',
  boxartUrl: 'https://example.com/large-cover.jpg',
}

describe('GameImage', () => {
  it('keeps rendered images contained inside their parent flex column', () => {
    const { container } = render(
      <GameImage game={game} aspectRatio="video" className="rounded-lg shadow-md" />,
    )

    const wrapper = container.firstElementChild

    expect(wrapper).toHaveClass('w-full')
    expect(wrapper).toHaveClass('max-w-full')
    expect(wrapper).toHaveClass('min-w-0')
    expect(wrapper).toHaveClass('overflow-hidden')
    expect(wrapper).toHaveClass('aspect-video')
    expect(screen.getByAltText(game.title)).toBeInTheDocument()
  })

  it('keeps fallback images contained when no art is available', () => {
    const { container } = render(
      <GameImage game={{ id: 'game-2', title: 'Missing Art' }} showFallback={true} />,
    )

    const wrapper = container.firstElementChild

    expect(wrapper).toHaveClass('w-full')
    expect(wrapper).toHaveClass('max-w-full')
    expect(wrapper).toHaveClass('min-w-0')
    expect(wrapper).toHaveClass('overflow-hidden')
    expect(screen.getByText('Missing Art')).toBeInTheDocument()
  })
})
