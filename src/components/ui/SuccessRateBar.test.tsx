import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SuccessRateBar from './SuccessRateBar'

describe('SuccessRateBar', () => {
  it('should render with basic rate', () => {
    render(<SuccessRateBar rate={75} />)

    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('should display vote count when provided', () => {
    render(<SuccessRateBar rate={80} voteCount={5} />)

    expect(screen.getByText('80% (5 votes)')).toBeInTheDocument()
  })

  it('should display singular vote when count is 1', () => {
    render(<SuccessRateBar rate={90} voteCount={1} />)

    expect(screen.getByText('90% (1 vote)')).toBeInTheDocument()
  })

  it('should hide vote count when hideVoteCount is true', () => {
    render(<SuccessRateBar rate={60} voteCount={3} hideVoteCount />)

    // When hideVoteCount is true, the text span is not rendered at all
    expect(screen.queryByText('60%')).not.toBeInTheDocument()
    expect(screen.queryByText('(3 votes)')).not.toBeInTheDocument()

    // But the progress bar should still be rendered
    const progressBar = document.querySelector('.bg-yellow-500')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveStyle({ width: '60%' })
  })

  it('should round decimal rates', () => {
    render(<SuccessRateBar rate={75.7} />)

    expect(screen.getByText('76%')).toBeInTheDocument()
  })

  it('should apply correct color classes based on rate', () => {
    const { rerender } = render(<SuccessRateBar rate={85} />)

    // High rate (>= 75) should be green
    let progressBar = document.querySelector('.bg-green-500')
    expect(progressBar).toBeInTheDocument()

    // Medium-high rate (>= 50, < 75) should be yellow
    rerender(<SuccessRateBar rate={60} />)
    progressBar = document.querySelector('.bg-yellow-500')
    expect(progressBar).toBeInTheDocument()

    // Medium-low rate (>= 25, < 50) should be orange
    rerender(<SuccessRateBar rate={35} />)
    progressBar = document.querySelector('.bg-orange-500')
    expect(progressBar).toBeInTheDocument()

    // Low rate (< 25) should be red
    rerender(<SuccessRateBar rate={15} />)
    progressBar = document.querySelector('.bg-red-500')
    expect(progressBar).toBeInTheDocument()
  })

  it('should set correct width style for progress bar', () => {
    render(<SuccessRateBar rate={42} />)

    const progressBar = document.querySelector('.bg-orange-500')
    expect(progressBar).toHaveStyle({ width: '42%' })
  })

  it('should handle edge cases', () => {
    const { rerender } = render(<SuccessRateBar rate={0} />)

    expect(screen.getByText('0%')).toBeInTheDocument()
    let progressBar = document.querySelector('.bg-red-500')
    expect(progressBar).toHaveStyle({ width: '0%' })

    rerender(<SuccessRateBar rate={100} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
    progressBar = document.querySelector('.bg-green-500')
    expect(progressBar).toHaveStyle({ width: '100%' })
  })

  it('should handle zero vote count', () => {
    render(<SuccessRateBar rate={50} voteCount={0} />)

    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.queryByText('votes')).not.toBeInTheDocument()
  })

  it('should have proper accessibility structure', () => {
    render(<SuccessRateBar rate={75} voteCount={10} />)

    // Should have a container with progress bar structure
    const container = document.querySelector('.w-full.h-2.bg-gray-200')
    expect(container).toBeInTheDocument()

    const progressBar = container?.querySelector(
      '.h-2.rounded-full.bg-green-500',
    )
    expect(progressBar).toBeInTheDocument()
  })
})
