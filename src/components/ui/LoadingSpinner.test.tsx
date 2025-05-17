import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)

    const svgElement = document.querySelector('svg')
    expect(svgElement).toBeInTheDocument()
    expect(svgElement).toHaveClass('h-8', 'w-8') // md size by default
    expect(svgElement).toHaveClass('text-blue-500') // default color
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

  it('renders with custom color', () => {
    render(<LoadingSpinner color="text-red-500" />)

    const svgElement = document.querySelector('svg')
    expect(svgElement).toHaveClass('text-red-500')
    expect(svgElement).not.toHaveClass('text-blue-500')
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

    const svgElement = document.querySelector('svg')
    expect(svgElement).toHaveAttribute('viewBox', '0 0 24 24')

    const circleElement = document.querySelector('circle')
    expect(circleElement).toBeInTheDocument()
    expect(circleElement).toHaveClass('opacity-25')

    const pathElement = document.querySelector('path')
    expect(pathElement).toBeInTheDocument()
    expect(pathElement).toHaveClass('opacity-75')
  })
})
