import { describe, expect, it } from 'vitest'
import { RISK_SIGNAL_TYPES, type AuthorRiskProfile } from '@/schemas/authorRisk'
import { SUBMISSION_RISK_SIGNAL_TYPES } from '@/schemas/submissionRisk'
import {
  computeSubmissionRiskProfile,
  isPlaceholderLikeEmulatorVersion,
} from './submission-risk.service'

const AUTHOR_ID = 'author-1'
const LISTING_ID = 'listing-1'

function createSubmission(value: unknown) {
  return {
    id: LISTING_ID,
    authorId: AUTHOR_ID,
    customFieldValues: [
      {
        value,
        customFieldDefinition: {
          name: 'emulator_version',
          label: 'Emulator Version',
        },
      },
    ],
  }
}

function createAuthorRiskProfile(signals: AuthorRiskProfile['signals']): AuthorRiskProfile {
  return {
    authorId: AUTHOR_ID,
    signals,
    highestSeverity: signals[0]?.severity ?? null,
  }
}

describe('isPlaceholderLikeEmulatorVersion', () => {
  it.each(['v0.1.4', 'v0.14', '014', 'o14', 'V 0 1 4'])(
    'detects placeholder-like value %s',
    (value) => {
      expect(isPlaceholderLikeEmulatorVersion(value)).toBe(true)
    },
  )

  it.each(['1.1.0', '2.0.0', '2123.2', '0.0.2-pre-alpha'])(
    'allows realistic version value %s',
    (value) => {
      expect(isPlaceholderLikeEmulatorVersion(value)).toBe(false)
    },
  )
})

describe('computeSubmissionRiskProfiles', () => {
  it('returns no signals when emulator_version is not placeholder-like', async () => {
    const profile = computeSubmissionRiskProfile(createSubmission('1.1.0'), undefined, undefined)

    expect(profile.signals).toHaveLength(0)
  })

  it('flags placeholder-like emulator_version as high risk for a new author', async () => {
    const profile = computeSubmissionRiskProfile(
      createSubmission('v0.1.4'),
      createAuthorRiskProfile([
        {
          type: RISK_SIGNAL_TYPES.NEW_AUTHOR,
          severity: 'low',
          label: 'New Author',
          description: 'No previously approved listings',
        },
      ]),
      undefined,
    )

    const signal = profile.signals[0]
    expect(signal?.type).toBe(SUBMISSION_RISK_SIGNAL_TYPES.PLACEHOLDER_EMULATOR_VERSION)
    expect(signal?.severity).toBe('high')
  })

  it('lowers placeholder severity for authors with multiple approved listings', async () => {
    const profile = computeSubmissionRiskProfile(createSubmission('v0.14'), undefined, {
      trustScore: 0,
      approvedListings: 3,
    })

    expect(profile.signals[0]?.severity).toBe('low')
  })

  it('lowers placeholder severity for contributor-level trust', async () => {
    const profile = computeSubmissionRiskProfile(createSubmission('014'), undefined, {
      trustScore: 100,
      approvedListings: 0,
    })

    expect(profile.signals[0]?.severity).toBe('low')
  })

  it('keeps placeholder severity medium for limited authors with prior low risk', async () => {
    const profile = computeSubmissionRiskProfile(
      createSubmission('o14'),
      createAuthorRiskProfile([
        {
          type: RISK_SIGNAL_TYPES.PREVIOUSLY_REJECTED,
          severity: 'low',
          label: 'Previously Rejected',
          description: '1 rejected listing',
        },
      ]),
      { trustScore: 0, approvedListings: 1 },
    )

    expect(profile.signals[0]?.severity).toBe('medium')
  })
})
