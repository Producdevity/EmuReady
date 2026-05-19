import { describe, expect, it, vi } from 'vitest'
import { RISK_SIGNAL_TYPES, type AuthorRiskProfile } from '@/schemas/authorRisk'
import { SUBMISSION_RISK_SIGNAL_TYPES, type SubmissionRiskProfile } from '@/schemas/submissionRisk'
import {
  attachHiddenReviewRiskProfiles,
  attachReviewRiskProfiles,
  getActiveAuthorBansForReviewRisk,
  getRiskyReviewItemIds,
} from './review-risk.service'

const AUTHOR_ID = '00000000-0000-4000-a000-000000000001'
const CLEAN_AUTHOR_ID = '00000000-0000-4000-a000-000000000002'
const LISTING_ID = '00000000-0000-4000-a000-000000000010'
const CLEAN_LISTING_ID = '00000000-0000-4000-a000-000000000011'

const authorRiskProfile: AuthorRiskProfile = {
  authorId: AUTHOR_ID,
  highestSeverity: 'high',
  signals: [
    {
      type: RISK_SIGNAL_TYPES.ACTIVE_BAN,
      severity: 'high',
      label: 'Active Ban',
      description: 'Banned for spam',
    },
  ],
}

const submissionRiskProfile: SubmissionRiskProfile = {
  listingId: LISTING_ID,
  highestSeverity: 'high',
  signals: [
    {
      type: SUBMISSION_RISK_SIGNAL_TYPES.PLACEHOLDER_EMULATOR_VERSION,
      severity: 'high',
      label: 'Placeholder Emulator Version',
      description: 'Submitted emulator version resembles placeholder text.',
    },
  ],
}

describe('review risk helpers', () => {
  it('returns only candidates with author or submission risk signals', () => {
    const riskCandidateIds = getRiskyReviewItemIds(
      [
        { id: LISTING_ID, authorId: AUTHOR_ID, customFieldValues: [] },
        { id: CLEAN_LISTING_ID, authorId: CLEAN_AUTHOR_ID, customFieldValues: [] },
      ],
      {
        authorRiskProfiles: new Map([[AUTHOR_ID, authorRiskProfile]]),
        submissionRiskProfiles: new Map([[LISTING_ID, submissionRiskProfile]]),
      },
    )

    expect(riskCandidateIds).toEqual([LISTING_ID])
  })

  it('attaches empty profiles when no risk profile exists for a listing', () => {
    const enrichedListings = attachReviewRiskProfiles(
      [{ id: CLEAN_LISTING_ID, authorId: CLEAN_AUTHOR_ID, title: 'Clean listing' }],
      {
        authorRiskProfiles: new Map(),
        submissionRiskProfiles: new Map(),
      },
    )

    expect(enrichedListings[0]).toMatchObject({
      id: CLEAN_LISTING_ID,
      authorId: CLEAN_AUTHOR_ID,
      title: 'Clean listing',
      authorRiskProfile: {
        authorId: CLEAN_AUTHOR_ID,
        signals: [],
        highestSeverity: null,
      },
      submissionRiskProfile: {
        listingId: CLEAN_LISTING_ID,
        signals: [],
        highestSeverity: null,
      },
    })
  })

  it('attaches null profiles when review risk is hidden from non-reviewers', () => {
    expect(attachHiddenReviewRiskProfiles({ id: LISTING_ID, authorId: AUTHOR_ID })).toEqual({
      id: LISTING_ID,
      authorId: AUTHOR_ID,
      authorRiskProfile: null,
      submissionRiskProfile: null,
    })
  })

  it('loads only active author bans for review risk detail enrichment', async () => {
    const findMany = vi.fn().mockResolvedValue([{ reason: 'Spam' }])
    const prisma = { userBan: { findMany } }

    await expect(getActiveAuthorBansForReviewRisk(prisma, AUTHOR_ID)).resolves.toEqual([
      { reason: 'Spam' },
    ])
    expect(findMany).toHaveBeenCalledWith({
      where: {
        userId: AUTHOR_ID,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
      },
      select: { reason: true },
    })
  })
})
