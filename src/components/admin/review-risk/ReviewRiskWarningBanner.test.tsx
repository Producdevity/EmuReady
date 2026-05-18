import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RISK_SIGNAL_TYPES, type AuthorRiskProfile } from '@/schemas/authorRisk'
import { SUBMISSION_RISK_SIGNAL_TYPES, type SubmissionRiskProfile } from '@/schemas/submissionRisk'
import { ReviewRiskWarningBanner } from './ReviewRiskWarningBanner'

const authorRiskProfile: AuthorRiskProfile = {
  authorId: 'author-1',
  signals: [
    {
      type: RISK_SIGNAL_TYPES.ACTIVE_REPORTS,
      severity: 'medium',
      label: 'Active Reports',
      description: '4 active reports across listings',
    },
  ],
  highestSeverity: 'medium',
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

describe('ReviewRiskWarningBanner', () => {
  it('renders nothing when there are no review risk signals', () => {
    const { container } = render(
      <ReviewRiskWarningBanner authorRiskProfile={null} submissionRiskProfile={null} />,
    )

    expect(container.innerHTML).toBe('')
  })

  it('separates submission risk from author risk', () => {
    render(
      <ReviewRiskWarningBanner
        authorRiskProfile={authorRiskProfile}
        submissionRiskProfile={submissionRiskProfile}
      />,
    )

    expect(screen.getByText('Submission Risk')).toBeInTheDocument()
    expect(screen.getByText('Author Risk')).toBeInTheDocument()
    expect(screen.getByText('Placeholder Emulator Version')).toBeInTheDocument()
    expect(screen.getByText('Active Reports')).toBeInTheDocument()
  })
})
