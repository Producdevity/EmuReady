import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)

    const svgElement = document.querySelector('svg')
    expect(svgElement).toBeInTheDocument()
    expect(svgElement).toHaveClass('h-8', 'w-8') // md size by default
    expect(svgElement).toHaveClass('animate-spin') // default animation
  })

  it('renders with small size', () => {
    render(<LoadingSpinner size="sm" />)

    const svgElement = document.querySelector('svg')
    expect(svgElement).toHaveClass('h-5', 'w-5')
  })

  it('renders with large size', () => {
    render(<LoadingSpinner size="lg" />)

    const svgElement = document.querySelector('svg')
    expect(svgElement).toHaveClass('h-12', 'w-12')
  })

  it('renders with text', () => {
    const loadingText = 'Loading data...'
    render(<LoadingSpinner text={loadingText} />)

    expect(screen.getByText(loadingText)).toBeInTheDocument()
  })

  it('does not render text when not provided', () => {
    render(<LoadingSpinner />)

    const paragraphElements = document.querySelectorAll('p')
    expect(paragraphElements.length).toBe(0)
  })

  it('renders correct SVG structure', () => {
    render(<LoadingSpinner />)

    const svgElement = document.querySelector('svg')!
    expect(svgElement).toHaveAttribute('viewBox', '0 0 24 24')

    // should be exactly two circles
    const circles = document.querySelectorAll('circle')
    expect(circles).toHaveLength(2)

    const [bgCircle, arcCircle] = circles

    // background ring
    expect(bgCircle).toHaveClass('opacity-25')
    expect(bgCircle).toHaveAttribute('stroke', 'url(#spinnerGradient)')
    expect(bgCircle).toHaveAttribute('stroke-width', '4')
    expect(bgCircle).toHaveAttribute('fill', 'none')

    // rotating arc
    expect(arcCircle).toHaveClass('opacity-75')
    expect(arcCircle).toHaveAttribute('stroke', 'url(#spinnerGradient)')
    expect(arcCircle).toHaveAttribute('stroke-width', '4')
    expect(arcCircle).toHaveAttribute('fill', 'none')
    expect(arcCircle).toHaveAttribute('stroke-dasharray', '15.7 62.8')
    expect(arcCircle).toHaveAttribute('stroke-linecap', 'round')
  })
})
