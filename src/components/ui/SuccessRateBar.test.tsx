import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SuccessRateBar } from './SuccessRateBar'

describe('SuccessRateBar', () => {
  it('should render with basic rate', () => {
    render(<SuccessRateBar rate={75} />)

    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('should display vote count when provided', () => {
    render(<SuccessRateBar rate={60} voteCount={150} />)

    expect(screen.getByText(/60%/)).toBeInTheDocument()
    expect(screen.getByText(/150 votes/)).toBeInTheDocument()
  })

  it('should display singular vote when count is 1', () => {
    render(<SuccessRateBar rate={100} voteCount={1} />)

    expect(screen.getByText(/100%/)).toBeInTheDocument()
    expect(screen.getByText(/1 vote/)).toBeInTheDocument()
  })

  it('should hide vote count when hideVoteCount is true', () => {
    const { container } = render(
      <SuccessRateBar rate={60} voteCount={150} hideVoteCount />,
    )

    // When hideVoteCount is true, no text should be rendered at all
    expect(screen.queryByText(/60%/)).not.toBeInTheDocument()
    expect(screen.queryByText(/votes/)).not.toBeInTheDocument()

    // But the progress bar should still be rendered (rate 60 = bg-yellow-400)
    const progressBar = container.querySelector('.bg-yellow-400')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveStyle({ width: '60%' })
  })

  it('should round decimal rates', () => {
    render(<SuccessRateBar rate={67.89} />)

    expect(screen.getByText('68%')).toBeInTheDocument()
  })

  it('should apply correct color classes based on rate', () => {
    const { container: container1 } = render(
      <SuccessRateBar rate={80} voteCount={100} />,
    )

    // High rate (80) should be green-400
    let progressBar = container1.querySelector('.bg-green-400')
    expect(progressBar).toBeInTheDocument()

    // Medium-high rate (60) should be yellow-400
    const { container: container2 } = render(
      <SuccessRateBar rate={60} voteCount={100} />,
    )
    progressBar = container2.querySelector('.bg-yellow-400')
    expect(progressBar).toBeInTheDocument()

    // Medium-low rate (30) should be orange-500
    const { container: container3 } = render(
      <SuccessRateBar rate={30} voteCount={100} />,
    )
    progressBar = container3.querySelector('.bg-orange-500')
    expect(progressBar).toBeInTheDocument()

    // Low rate (10) should be red-500
    const { container: container4 } = render(
      <SuccessRateBar rate={10} voteCount={100} />,
    )
    progressBar = container4.querySelector('.bg-red-500')
    expect(progressBar).toBeInTheDocument()
  })

  it('should set correct width style for progress bar', () => {
    const { container } = render(<SuccessRateBar rate={42} voteCount={100} />)

    const progressBar = container.querySelector('.bg-orange-400')
    expect(progressBar).toHaveStyle({ width: '42%' })
  })

  it('should handle edge cases', () => {
    const { rerender, container } = render(
      <SuccessRateBar rate={0} voteCount={2} />,
    )

    expect(screen.getByText(/0%/)).toBeInTheDocument()
    let progressBar = container.querySelector('.bg-red-600')
    expect(progressBar).toHaveStyle({ width: '100%' }) // Shows 100% width when rate=0 but has votes

    rerender(<SuccessRateBar rate={100} voteCount={1} />)
    expect(screen.getByText(/100%/)).toBeInTheDocument()
    progressBar = container.querySelector('.bg-green-600')
    expect(progressBar).toHaveStyle({ width: '100%' })
  })

  it('should handle zero vote count', () => {
    render(<SuccessRateBar rate={50} voteCount={0} />)

    // With voteCount=0, component only shows the percentage since votes text is conditional
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.queryByText(/votes/)).not.toBeInTheDocument()
  })

  it('should have proper accessibility structure', () => {
    const { container } = render(<SuccessRateBar rate={75} voteCount={25} />)

    // Should have a container with progress bar structure
    const progressContainer = container.querySelector('.w-full.h-2.bg-gray-200')
    expect(progressContainer).toBeInTheDocument()

    const progressBar = progressContainer?.querySelector('.h-2.rounded-full')
    expect(progressBar).toBeInTheDocument()
  })
})
