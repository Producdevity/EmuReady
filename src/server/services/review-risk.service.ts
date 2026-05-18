import { type AuthorRiskProfile } from '@/schemas/authorRisk'
import { type SubmissionRiskProfile } from '@/schemas/submissionRisk'
import {
  type AuthorBanRiskCandidate,
  computeAuthorRiskProfiles,
  createExistingAuthorBansMap,
} from '@/server/services/author-risk.service'
import {
  computeSubmissionRiskProfiles,
  type SubmissionForRisk,
} from '@/server/services/submission-risk.service'

type RiskPrismaClient = Parameters<typeof computeAuthorRiskProfiles>[0]

type ReviewRiskCandidate = AuthorBanRiskCandidate & SubmissionForRisk

interface ReviewRiskProfiles {
  authorRiskProfiles: Map<string, AuthorRiskProfile>
  submissionRiskProfiles: Map<string, SubmissionRiskProfile>
}

interface RiskOnlyReviewPageParams<
  TCandidate extends ReviewRiskCandidate,
  TListing extends { id: string; authorId: string },
> {
  prisma: RiskPrismaClient
  page: number
  limit: number
  loadCandidates: () => Promise<readonly TCandidate[]>
  loadItemsByIds: (ids: string[]) => Promise<readonly TListing[]>
}

interface RiskOnlyReviewPage<TListing extends { id: string; authorId: string }> {
  items: ReviewRiskEnriched<TListing>[]
  total: number
}

export type ReviewRiskEnriched<TListing extends { id: string; authorId: string }> = TListing & {
  authorRiskProfile: AuthorRiskProfile
  submissionRiskProfile: SubmissionRiskProfile
}

function createEmptyAuthorRiskProfile(authorId: string): AuthorRiskProfile {
  return { authorId, signals: [], highestSeverity: null }
}

function createEmptySubmissionRiskProfile(listingId: string): SubmissionRiskProfile {
  return { listingId, signals: [], highestSeverity: null }
}

function hasRiskSignals(candidate: ReviewRiskCandidate, profiles: ReviewRiskProfiles): boolean {
  const authorRiskProfile = profiles.authorRiskProfiles.get(candidate.authorId)
  if (authorRiskProfile && authorRiskProfile.signals.length > 0) return true

  const submissionRiskProfile = profiles.submissionRiskProfiles.get(candidate.id)
  return Boolean(submissionRiskProfile && submissionRiskProfile.signals.length > 0)
}

export async function computeReviewRiskProfiles<TCandidate extends ReviewRiskCandidate>(
  prisma: RiskPrismaClient,
  candidates: readonly TCandidate[],
): Promise<ReviewRiskProfiles> {
  const authorIds = [...new Set(candidates.map((candidate) => candidate.authorId))]
  const authorRiskProfiles = await computeAuthorRiskProfiles(
    prisma,
    authorIds,
    createExistingAuthorBansMap(candidates),
  )
  const submissionRiskProfiles = await computeSubmissionRiskProfiles(
    prisma,
    candidates,
    authorRiskProfiles,
  )

  return { authorRiskProfiles, submissionRiskProfiles }
}

export function getRiskyReviewItemIds<TCandidate extends ReviewRiskCandidate>(
  candidates: readonly TCandidate[],
  profiles: ReviewRiskProfiles,
): string[] {
  return candidates
    .filter((candidate) => hasRiskSignals(candidate, profiles))
    .map((candidate) => candidate.id)
}

export function attachReviewRiskProfiles<TListing extends { id: string; authorId: string }>(
  listings: readonly TListing[],
  profiles: ReviewRiskProfiles,
): ReviewRiskEnriched<TListing>[] {
  return listings.map((listing) => ({
    ...listing,
    authorRiskProfile:
      profiles.authorRiskProfiles.get(listing.authorId) ??
      createEmptyAuthorRiskProfile(listing.authorId),
    submissionRiskProfile:
      profiles.submissionRiskProfiles.get(listing.id) ??
      createEmptySubmissionRiskProfile(listing.id),
  }))
}

export async function getRiskOnlyReviewPage<
  TCandidate extends ReviewRiskCandidate,
  TListing extends { id: string; authorId: string },
>(params: RiskOnlyReviewPageParams<TCandidate, TListing>): Promise<RiskOnlyReviewPage<TListing>> {
  const candidates = await params.loadCandidates()
  const profiles = await computeReviewRiskProfiles(params.prisma, candidates)
  const riskyItemIds = getRiskyReviewItemIds(candidates, profiles)
  const offset = (params.page - 1) * params.limit
  const pageItemIds = riskyItemIds.slice(offset, offset + params.limit)
  const pageItems = pageItemIds.length > 0 ? await params.loadItemsByIds(pageItemIds) : []
  const pageItemMap = new Map(pageItems.map((item) => [item.id, item]))
  const sortedPageItems = pageItemIds.flatMap((itemId) => {
    const item = pageItemMap.get(itemId)
    return item ? [item] : []
  })

  return {
    items: attachReviewRiskProfiles(sortedPageItems, profiles),
    total: riskyItemIds.length,
  }
}
