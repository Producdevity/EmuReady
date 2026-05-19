import { TRUST_LEVELS, hasTrustLevel } from '@/lib/trust/config'
import { RISK_SIGNAL_TYPES, type AuthorRiskProfile } from '@/schemas/authorRisk'
import { type Severity } from '@/schemas/common'
import {
  EMULATOR_VERSION_FIELD_NAME,
  SUBMISSION_RISK_SIGNAL_TYPES,
  type SubmissionRiskProfile,
  type SubmissionRiskSignal,
  type SubmissionRiskSignalType,
} from '@/schemas/submissionRisk'
import { ApprovalStatus, type PrismaClient } from '@orm'

interface CustomFieldDefinitionForRisk {
  name: string
  label: string
}

interface CustomFieldValueForRisk {
  value: unknown
  customFieldDefinition: CustomFieldDefinitionForRisk
}

export interface SubmissionForRisk {
  id: string
  authorId: string
  customFieldValues?: readonly CustomFieldValueForRisk[] | null
}

export interface AuthorCredibility {
  trustScore: number
  approvedListings: number
}

const PLACEHOLDER_VERSION_DIGITS = '014'
const MIN_APPROVED_LISTINGS_FOR_CREDIBILITY = 3
const TRUST_LEVEL_FOR_CREDIBILITY = TRUST_LEVELS[1].name

const SEVERITY_ORDER: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
}

function createSignal(
  type: SubmissionRiskSignalType,
  severity: Severity,
  label: string,
  description: string,
): SubmissionRiskSignal {
  return { type, severity, label, description }
}

function highestSeverity(signals: SubmissionRiskSignal[]): Severity | null {
  if (signals.length === 0) return null
  let max = signals[0].severity
  for (const signal of signals) {
    if (SEVERITY_ORDER[signal.severity] > SEVERITY_ORDER[max]) max = signal.severity
  }
  return max
}

function createEmptyProfile(listingId: string): SubmissionRiskProfile {
  return { listingId, signals: [], highestSeverity: null }
}

function compactVersionValue(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replaceAll('o', '0')
    .replaceAll('i', '1')
    .replaceAll('l', '1')
    .replace(/[^a-z0-9]/g, '')
}

export function isPlaceholderLikeEmulatorVersion(value: unknown): value is string {
  if (typeof value !== 'string') return false

  const compactValue = compactVersionValue(value)
  if (compactValue.length === 0) return false

  const digitSignature = compactValue.replace(/\D/g, '')
  return digitSignature === PLACEHOLDER_VERSION_DIGITS
}

function getEmulatorVersionValue(submission: SubmissionForRisk): string | null {
  const fieldValue = submission.customFieldValues?.find(
    (customFieldValue) =>
      customFieldValue.customFieldDefinition.name === EMULATOR_VERSION_FIELD_NAME,
  )

  return isPlaceholderLikeEmulatorVersion(fieldValue?.value) ? fieldValue.value : null
}

async function batchGetAuthorCredibility(
  prisma: PrismaClient,
  authorIds: string[],
): Promise<Map<string, AuthorCredibility>> {
  const uniqueAuthorIds = [...new Set(authorIds)]
  const [users, listingApprovals, pcListingApprovals] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: uniqueAuthorIds } },
      select: { id: true, trustScore: true },
    }),
    prisma.listing.groupBy({
      by: ['authorId'],
      where: { authorId: { in: uniqueAuthorIds }, status: ApprovalStatus.APPROVED },
      _count: true,
    }),
    prisma.pcListing.groupBy({
      by: ['authorId'],
      where: { authorId: { in: uniqueAuthorIds }, status: ApprovalStatus.APPROVED },
      _count: true,
    }),
  ])

  const credibilityMap = new Map<string, AuthorCredibility>()

  for (const authorId of uniqueAuthorIds) {
    credibilityMap.set(authorId, { trustScore: 0, approvedListings: 0 })
  }

  for (const user of users) {
    const credibility = credibilityMap.get(user.id) ?? { trustScore: 0, approvedListings: 0 }
    credibilityMap.set(user.id, { ...credibility, trustScore: user.trustScore })
  }

  for (const row of listingApprovals) {
    const credibility = credibilityMap.get(row.authorId) ?? { trustScore: 0, approvedListings: 0 }
    credibilityMap.set(row.authorId, {
      ...credibility,
      approvedListings: credibility.approvedListings + row._count,
    })
  }

  for (const row of pcListingApprovals) {
    const credibility = credibilityMap.get(row.authorId) ?? { trustScore: 0, approvedListings: 0 }
    credibilityMap.set(row.authorId, {
      ...credibility,
      approvedListings: credibility.approvedListings + row._count,
    })
  }

  return credibilityMap
}

function hasNewAuthorRisk(authorRiskProfile: AuthorRiskProfile | undefined): boolean {
  if (!authorRiskProfile || authorRiskProfile.signals.length === 0) return false
  return authorRiskProfile.signals.some((signal) => signal.type === RISK_SIGNAL_TYPES.NEW_AUTHOR)
}

function getPlaceholderVersionSeverity(params: {
  authorRiskProfile: AuthorRiskProfile | undefined
  credibility: AuthorCredibility | undefined
}): Severity {
  const credibility = params.credibility ?? { trustScore: 0, approvedListings: 0 }
  const isCredibleAuthor =
    credibility.approvedListings >= MIN_APPROVED_LISTINGS_FOR_CREDIBILITY ||
    hasTrustLevel(credibility.trustScore, TRUST_LEVEL_FOR_CREDIBILITY)

  if (isCredibleAuthor) return 'low'

  if (params.authorRiskProfile?.highestSeverity === 'high') return 'high'
  if (!params.authorRiskProfile) return 'high'
  if (credibility.approvedListings === 0 || hasNewAuthorRisk(params.authorRiskProfile))
    return 'high'
  if (params.authorRiskProfile.highestSeverity === 'medium') return 'high'

  return 'medium'
}

function getPlaceholderVersionDescription(params: {
  value: string
  severity: Severity
  credibility: AuthorCredibility | undefined
}): string {
  const approvedListings = params.credibility?.approvedListings ?? 0
  const trustScore = params.credibility?.trustScore ?? 0
  const context =
    params.severity === 'low'
      ? 'The author has established contribution history, so this may be a mistake.'
      : approvedListings === 0
        ? 'The author has no approved listings, so this needs close review.'
        : 'The author has limited established contribution history, so this needs close review.'

  return `Submitted emulator version "${params.value}" resembles placeholder text. ${context} Approved listings: ${approvedListings}. Trust score: ${trustScore}.`
}

export async function computeSubmissionRiskProfiles(
  prisma: PrismaClient,
  submissions: readonly SubmissionForRisk[],
  authorRiskProfiles: ReadonlyMap<string, AuthorRiskProfile>,
): Promise<Map<string, SubmissionRiskProfile>> {
  const profileMap = new Map<string, SubmissionRiskProfile>()

  if (submissions.length === 0) return profileMap

  const credibilityMap = await batchGetAuthorCredibility(
    prisma,
    submissions.map((submission) => submission.authorId),
  )

  for (const submission of submissions) {
    profileMap.set(
      submission.id,
      computeSubmissionRiskProfile(
        submission,
        authorRiskProfiles.get(submission.authorId),
        credibilityMap.get(submission.authorId),
      ),
    )
  }

  return profileMap
}

export function computeSubmissionRiskProfile(
  submission: SubmissionForRisk,
  authorRiskProfile: AuthorRiskProfile | undefined,
  credibility: AuthorCredibility | undefined,
): SubmissionRiskProfile {
  const emulatorVersionValue = getEmulatorVersionValue(submission)
  if (!emulatorVersionValue) return createEmptyProfile(submission.id)

  const severity = getPlaceholderVersionSeverity({ authorRiskProfile, credibility })
  const signals = [
    createSignal(
      SUBMISSION_RISK_SIGNAL_TYPES.PLACEHOLDER_EMULATOR_VERSION,
      severity,
      'Placeholder Emulator Version',
      getPlaceholderVersionDescription({ value: emulatorVersionValue, severity, credibility }),
    ),
  ]

  return {
    listingId: submission.id,
    signals,
    highestSeverity: highestSeverity(signals),
  }
}
