import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VoteDirectionIcon } from './VoteDirectionIcon'

describe('VoteDirectionIcon', () => {
  it('renders upvote icon with aria-label "Upvote" when value is true', () => {
    render(<VoteDirectionIcon value={true} />)
    const icon = screen.getByLabelText('Upvote')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveAttribute('role', 'img')
  })

  it('renders downvote icon with aria-label "Downvote" when value is false', () => {
    render(<VoteDirectionIcon value={false} />)
    const icon = screen.getByLabelText('Downvote')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveAttribute('role', 'img')
  })

  it('applies green color class for upvote', () => {
    render(<VoteDirectionIcon value={true} />)
    const icon = screen.getByLabelText('Upvote')
    expect(icon).toHaveClass('text-green-600')
  })

  it('applies red color class for downvote', () => {
    render(<VoteDirectionIcon value={false} />)
    const icon = screen.getByLabelText('Downvote')
    expect(icon).toHaveClass('text-red-600')
  })
})
