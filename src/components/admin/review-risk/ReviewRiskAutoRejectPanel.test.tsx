import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReviewRiskAutoRejectPanel } from './ReviewRiskAutoRejectPanel'

describe('ReviewRiskAutoRejectPanel', () => {
  it('explains the matching rule and calls the auto-reject action', async () => {
    const user = userEvent.setup()
    const onAutoReject = vi.fn()

    render(
      <ReviewRiskAutoRejectPanel
        reportLabel="PC"
        eligibleCount={3}
        reviewRiskQueueCount={8}
        isCountLoading={false}
        hasCountError={false}
        isSubmitting={false}
        onAutoReject={onAutoReject}
      />,
    )

    expect(screen.getByText('Auto-reject matching review-risk reports')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Scans all pending PC reports and matches high author risk, or high submission risk plus at least one author risk signal.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Eligible: 3 PC reports')).toBeInTheDocument()
    expect(screen.getByText('All pending review-risk queue: 8 PC reports')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /reject 3 reports/i }))

    expect(onAutoReject).toHaveBeenCalledTimes(1)
  })

  it('disables the action while submitting', () => {
    render(
      <ReviewRiskAutoRejectPanel
        reportLabel="handheld"
        eligibleCount={2}
        reviewRiskQueueCount={4}
        isCountLoading={false}
        hasCountError={false}
        isSubmitting
        onAutoReject={vi.fn()}
      />,
    )

    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByText(/pending handheld reports/i)).toBeInTheDocument()
  })

  it('disables the action when no reports match the auto-reject rule', () => {
    render(
      <ReviewRiskAutoRejectPanel
        reportLabel="handheld"
        eligibleCount={0}
        reviewRiskQueueCount={5}
        isCountLoading={false}
        hasCountError={false}
        isSubmitting={false}
        onAutoReject={vi.fn()}
      />,
    )

    expect(screen.getByText('Eligible: 0 handheld reports')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no matching reports/i })).toBeDisabled()
  })
})
