import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RISK_SIGNAL_TYPES, type AuthorRiskProfile } from '@/schemas/authorRisk'
import { SUBMISSION_RISK_SIGNAL_TYPES, type SubmissionRiskProfile } from '@/schemas/submissionRisk'
import { ReviewRiskIndicator } from './ReviewRiskIndicator'

const authorRiskProfile: AuthorRiskProfile = {
  authorId: 'author-1',
  signals: [
    {
      type: RISK_SIGNAL_TYPES.NEW_AUTHOR,
      severity: 'low',
      label: 'New Author',
      description: 'No previously approved listings',
    },
  ],
  highestSeverity: 'low',
}

const submissionRiskProfile: SubmissionRiskProfile = {
  listingId: 'listing-1',
  signals: [
    {
      type: SUBMISSION_RISK_SIGNAL_TYPES.PLACEHOLDER_EMULATOR_VERSION,
      severity: 'high',
      label: 'Placeholder Emulator Version',
      description: 'Submitted emulator version resembles placeholder text.',
    },
  ],
  highestSeverity: 'high',
}

describe('ReviewRiskIndicator', () => {
  it('renders nothing when there are no review risk signals', () => {
    const { container } = render(
      <ReviewRiskIndicator authorRiskProfile={null} submissionRiskProfile={null} />,
    )

    expect(container.innerHTML).toBe('')
  })

  it('uses the highest severity across author and submission risk', () => {
    render(
      <ReviewRiskIndicator
        authorRiskProfile={authorRiskProfile}
        submissionRiskProfile={submissionRiskProfile}
      />,
    )

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-label', 'Review risk: high severity, 2 signals')
    expect(status.querySelector('svg')).toHaveClass('text-red-500')
  })

  it('renders for submission risk without author risk', () => {
    render(
      <ReviewRiskIndicator
        authorRiskProfile={null}
        submissionRiskProfile={submissionRiskProfile}
      />,
    )

    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Review risk: high severity, 1 signal',
    )
  })

  it('calls investigate from pointer and keyboard activation when author risk exists', async () => {
    const user = userEvent.setup()
    const onInvestigate = vi.fn()

    render(
      <ReviewRiskIndicator
        authorRiskProfile={authorRiskProfile}
        submissionRiskProfile={submissionRiskProfile}
        onInvestigate={onInvestigate}
      />,
    )

    const button = screen.getByRole('button', {
      name: 'Review risk: high severity, 2 signals',
    })
    await user.click(button)
    button.focus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')

    expect(onInvestigate).toHaveBeenCalledTimes(3)
    expect(onInvestigate).toHaveBeenNthCalledWith(1, authorRiskProfile.authorId)
    expect(onInvestigate).toHaveBeenNthCalledWith(2, authorRiskProfile.authorId)
    expect(onInvestigate).toHaveBeenNthCalledWith(3, authorRiskProfile.authorId)
  })

  it('does not expose investigate action for submission-only risk', () => {
    const onInvestigate = vi.fn()

    render(
      <ReviewRiskIndicator
        authorRiskProfile={null}
        submissionRiskProfile={submissionRiskProfile}
        onInvestigate={onInvestigate}
      />,
    )

    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Review risk: high severity, 1 signal',
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
