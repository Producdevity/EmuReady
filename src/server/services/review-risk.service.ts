import { type AuthorRiskProfile } from '@/schemas/authorRisk'
import { type SubmissionRiskProfile } from '@/schemas/submissionRisk'
import {
  type AuthorBanRiskCandidate,
  computeAuthorRiskProfiles,
  createExistingAuthorBansMap,
  type ExistingAuthorBan,
} from '@/server/services/author-risk.service'
import {
  computeSubmissionRiskProfiles,
  type SubmissionForRisk,
} from '@/server/services/submission-risk.service'
import { roleIncludesRole } from '@/utils/permission-system'
import { Role } from '@orm/client'

type RiskPrismaClient = Parameters<typeof computeAuthorRiskProfiles>[0]
type DetailReviewRiskPrismaClient = RiskPrismaClient & ActiveAuthorBansPrismaClient

export type ReviewRiskCandidate = AuthorBanRiskCandidate & SubmissionForRisk

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

export interface AutoRejectReviewRiskItem {
  id: string
  processedNotes: string
}

export interface AutoRejectReviewRiskPreview {
  eligibleCount: number
  reviewRiskQueueCount: number
}

interface ActiveAuthorBansPrismaClient {
  userBan: {
    findMany: (args: {
      where: {
        userId: string
        isActive: true
        OR: [{ expiresAt: null }, { expiresAt: { gt: Date } }]
      }
      select: { reason: true }
    }) => Promise<ExistingAuthorBan[]>
  }
}

export type ReviewRiskEnriched<TListing extends { id: string; authorId: string }> = TListing & {
  authorRiskProfile: AuthorRiskProfile
  submissionRiskProfile: SubmissionRiskProfile
}

export type HiddenReviewRiskEnriched<TListing extends { id: string; authorId: string }> =
  TListing & {
    authorRiskProfile: null
    submissionRiskProfile: null
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

function hasAuthorRiskSignals(profile: AuthorRiskProfile | undefined): boolean {
  return Boolean(profile && profile.signals.length > 0)
}

function hasHighAuthorRisk(profile: AuthorRiskProfile | undefined): boolean {
  return Boolean(profile && profile.highestSeverity === 'high' && profile.signals.length > 0)
}

function hasHighSubmissionRisk(profile: SubmissionRiskProfile | undefined): boolean {
  return Boolean(profile && profile.highestSeverity === 'high' && profile.signals.length > 0)
}

function isAutoRejectableReviewRisk(params: {
  authorRiskProfile: AuthorRiskProfile | undefined
  submissionRiskProfile: SubmissionRiskProfile | undefined
}): boolean {
  if (hasHighAuthorRisk(params.authorRiskProfile)) return true

  return (
    hasHighSubmissionRisk(params.submissionRiskProfile) &&
    hasAuthorRiskSignals(params.authorRiskProfile)
  )
}

function formatSignalCount(signalCount: number): string {
  return `${signalCount} signal${signalCount === 1 ? '' : 's'}`
}

function buildAutoRejectProcessedNotes(params: {
  authorRiskProfile: AuthorRiskProfile | undefined
  submissionRiskProfile: SubmissionRiskProfile | undefined
}): string {
  const reasons: string[] = []

  if (hasHighSubmissionRisk(params.submissionRiskProfile)) {
    reasons.push('submission risk high severity')
  }

  const authorRiskProfile = params.authorRiskProfile
  if (authorRiskProfile && authorRiskProfile.signals.length > 0) {
    const signalCount = authorRiskProfile.signals.length
    const severity = authorRiskProfile.highestSeverity ?? 'unknown'
    reasons.push(`author risk ${severity} severity (${formatSignalCount(signalCount)})`)
  }

  return `Automatically rejected by review risk bulk action: ${reasons.join('; ')}.`
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

export function getAutoRejectableReviewRiskItems<TCandidate extends ReviewRiskCandidate>(
  candidates: readonly TCandidate[],
  profiles: ReviewRiskProfiles,
): AutoRejectReviewRiskItem[] {
  return candidates.flatMap((candidate) => {
    const authorRiskProfile = profiles.authorRiskProfiles.get(candidate.authorId)
    const submissionRiskProfile = profiles.submissionRiskProfiles.get(candidate.id)

    if (
      !isAutoRejectableReviewRisk({
        authorRiskProfile,
        submissionRiskProfile,
      })
    ) {
      return []
    }

    return [
      {
        id: candidate.id,
        processedNotes: buildAutoRejectProcessedNotes({
          authorRiskProfile,
          submissionRiskProfile,
        }),
      },
    ]
  })
}

export function getAutoRejectableReviewRiskPreview<TCandidate extends ReviewRiskCandidate>(
  candidates: readonly TCandidate[],
  profiles: ReviewRiskProfiles,
): AutoRejectReviewRiskPreview {
  return {
    eligibleCount: getAutoRejectableReviewRiskItems(candidates, profiles).length,
    reviewRiskQueueCount: getRiskyReviewItemIds(candidates, profiles).length,
  }
}

export async function getAutoRejectableReviewRiskItemsForCandidates<
  TCandidate extends ReviewRiskCandidate,
>(params: {
  prisma: RiskPrismaClient
  loadCandidates: () => Promise<readonly TCandidate[]>
}): Promise<AutoRejectReviewRiskItem[]> {
  const candidates = await params.loadCandidates()
  const profiles = await computeReviewRiskProfiles(params.prisma, candidates)

  return getAutoRejectableReviewRiskItems(candidates, profiles)
}

export async function getAutoRejectableReviewRiskPreviewForCandidates<
  TCandidate extends ReviewRiskCandidate,
>(params: {
  prisma: RiskPrismaClient
  loadCandidates: () => Promise<readonly TCandidate[]>
}): Promise<AutoRejectReviewRiskPreview> {
  const candidates = await params.loadCandidates()
  const profiles = await computeReviewRiskProfiles(params.prisma, candidates)

  return getAutoRejectableReviewRiskPreview(candidates, profiles)
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

export function attachHiddenReviewRiskProfiles<TListing extends { id: string; authorId: string }>(
  listing: TListing,
): HiddenReviewRiskEnriched<TListing> {
  return {
    ...listing,
    authorRiskProfile: null,
    submissionRiskProfile: null,
  }
}

export async function attachReviewRiskProfile<
  TListing extends { id: string; authorId: string },
  TCandidate extends ReviewRiskCandidate,
>(
  prisma: RiskPrismaClient,
  listing: TListing,
  candidate: TCandidate,
): Promise<ReviewRiskEnriched<TListing>> {
  const profiles = await computeReviewRiskProfiles(prisma, [candidate])
  const [enrichedListing] = attachReviewRiskProfiles([listing], profiles)

  return (
    enrichedListing ?? {
      ...listing,
      authorRiskProfile: createEmptyAuthorRiskProfile(listing.authorId),
      submissionRiskProfile: createEmptySubmissionRiskProfile(listing.id),
    }
  )
}

export async function getActiveAuthorBansForReviewRisk(
  prisma: ActiveAuthorBansPrismaClient,
  authorId: string,
): Promise<ExistingAuthorBan[]> {
  return await prisma.userBan.findMany({
    where: {
      userId: authorId,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { reason: true },
  })
}

export function canViewReviewRiskProfiles(userRole?: Role | null): boolean {
  return roleIncludesRole(userRole, Role.MODERATOR) || roleIncludesRole(userRole, Role.DEVELOPER)
}

export async function attachReviewRiskProfileForViewer<TListing extends SubmissionForRisk>(params: {
  prisma: DetailReviewRiskPrismaClient
  listing: TListing
  userRole?: Role | null
}): Promise<ReviewRiskEnriched<TListing> | HiddenReviewRiskEnriched<TListing>> {
  if (!canViewReviewRiskProfiles(params.userRole)) {
    return attachHiddenReviewRiskProfiles(params.listing)
  }

  const userBans = await getActiveAuthorBansForReviewRisk(params.prisma, params.listing.authorId)

  return await attachReviewRiskProfile(params.prisma, params.listing, {
    id: params.listing.id,
    authorId: params.listing.authorId,
    author: { userBans },
    customFieldValues: params.listing.customFieldValues,
  })
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
