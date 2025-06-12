import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoadingSpinner from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    const { container } = render(<LoadingSpinner />)

    const svgElement = container.querySelector('svg')!
    expect(svgElement).toBeInTheDocument()
    expect(svgElement).toHaveClass('h-8', 'w-8') // md size by default
    expect(svgElement).toHaveClass('animate-spin') // default animation
  })

  it('renders with small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />)

    const svgElement = container.querySelector('svg')!
    expect(svgElement).toHaveClass('h-5', 'w-5')
  })

  it('renders with large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />)

    const svgElement = container.querySelector('svg')!
    expect(svgElement).toHaveClass('h-12', 'w-12')
  })

  it('renders with text', () => {
    render(<LoadingSpinner text="Loading data..." />)

    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('does not render text when not provided', () => {
    render(<LoadingSpinner />)

    // Should not have any text content
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  })

  it('renders correct SVG structure', () => {
    const { container } = render(<LoadingSpinner />)

    const svgElement = container.querySelector('svg')!
    expect(svgElement).toHaveAttribute('viewBox', '0 0 24 24')

    // should be exactly two circles
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(2)

    // The component actually uses circles, not a path
    const paths = container.querySelectorAll('path')
    expect(paths).toHaveLength(0)
  })
})
