import { describe, expect, it, vi } from 'vitest'
import { type Severity } from '@/schemas/common'
import { confirmBulkApproval } from './bulkApprovalConfirmation'

interface TestRiskProfile {
  highestSeverity: Severity | null
}

interface TestListing {
  id: string
  author?: { name: string | null } | null
  authorRiskProfile?: TestRiskProfile | null
  submissionRiskProfile?: TestRiskProfile | null
}

interface ConfirmOptions {
  title: string
  description: string
  confirmText: string
}

function createConfirm() {
  return vi.fn((options: ConfirmOptions) => Promise.resolve(options.confirmText.length > 0))
}

describe('confirmBulkApproval', () => {
  it('warns when a selected listing only has submission risk', async () => {
    const confirm = createConfirm()

    const result = await confirmBulkApproval<TestListing>(
      [
        {
          id: 'listing-1',
          author: { name: 'New User' },
          authorRiskProfile: null,
          submissionRiskProfile: { highestSeverity: 'high' },
        },
      ],
      ['listing-1'],
      confirm,
      'listings',
    )

    expect(result).toBe(true)
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Bulk Approval Warning',
        confirmText: 'Approve Selected',
      }),
    )
    expect(confirm.mock.calls[0]?.[0].description).toContain('including 1 with review risk signals')
    expect(confirm.mock.calls[0]?.[0].description).toContain('highest: high')
  })

  it('uses the highest severity across author and submission risk', async () => {
    const confirm = createConfirm()

    await confirmBulkApproval<TestListing>(
      [
        {
          id: 'listing-1',
          author: { name: 'Risky Author' },
          authorRiskProfile: { highestSeverity: 'medium' },
          submissionRiskProfile: { highestSeverity: 'high' },
        },
      ],
      ['listing-1'],
      confirm,
      'listings',
    )

    expect(confirm.mock.calls[0]?.[0].description).toContain('highest: high')
  })

  it('uses the normal confirmation when selected listings have no risk', async () => {
    const confirm = createConfirm()

    await confirmBulkApproval<TestListing>(
      [
        {
          id: 'listing-1',
          author: { name: 'Clean Author' },
          authorRiskProfile: { highestSeverity: null },
          submissionRiskProfile: { highestSeverity: null },
        },
      ],
      ['listing-1'],
      confirm,
      'listings',
    )

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Bulk Approval Confirmation',
      }),
    )
  })

  it('uses the normal confirmation when selected listings have no risk profiles loaded', async () => {
    const confirm = createConfirm()

    await confirmBulkApproval<TestListing>(
      [
        {
          id: 'listing-1',
          author: { name: 'Unknown Risk Author' },
        },
      ],
      ['listing-1'],
      confirm,
      'listings',
    )

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Bulk Approval Confirmation',
      }),
    )
  })
})
