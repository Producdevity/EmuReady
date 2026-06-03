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
        isSubmitting={false}
        onAutoReject={onAutoReject}
      />,
    )

    expect(screen.getByText('Auto-reject matching review-risk reports')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Applies to all pending PC reports with high submission risk or any author risk signal.',
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /reject matching reports/i }))

    expect(onAutoReject).toHaveBeenCalledTimes(1)
  })

  it('disables the action while submitting', () => {
    render(<ReviewRiskAutoRejectPanel reportLabel="handheld" isSubmitting onAutoReject={vi.fn()} />)

    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByText(/pending handheld reports/i)).toBeInTheDocument()
  })
})
