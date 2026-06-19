import { ResourceError } from '@/lib/errors'
import {
  PcListingBulkModerationRepository,
  type PcBulkApproveTarget,
  type PcBulkModerationTarget,
} from '@/server/repositories/pc-listing-bulk-moderation.repository'
import { hasRolePermission } from '@/utils/permissions'
import { Role, type PrismaClient, type Role as UserRole } from '@orm/client'

type PcBulkModerationAction = 'approve' | 'reject'

interface PcBulkModerationActor {
  userId: string
  role: UserRole
}

interface BulkApprovePcListingsInput {
  pcListingIds: string[]
  actor: PcBulkModerationActor
}

interface BulkRejectPcListingsInput {
  pcListingIds: string[]
  notes?: string
  actor: PcBulkModerationActor
}

interface PcBulkModerationResult<TListing extends PcBulkModerationTarget> {
  pcListings: TListing[]
  count: number
  processedAt: Date
}

function canModerateAsModerator(role: UserRole): boolean {
  return hasRolePermission(role, Role.MODERATOR)
}

function canModerateAsDeveloper(role: UserRole): boolean {
  return hasRolePermission(role, Role.DEVELOPER)
}

async function assertDeveloperCanModeratePcListings(params: {
  repository: PcListingBulkModerationRepository
  userId: string
  action: PcBulkModerationAction
  pcListings: PcBulkModerationTarget[]
}): Promise<void> {
  const verifiedEmulatorIds = new Set(
    await params.repository.listVerifiedEmulatorIds(params.userId),
  )
  const hasUnauthorizedListings = params.pcListings.some(
    (pcListing) => !verifiedEmulatorIds.has(pcListing.emulatorId),
  )

  if (!hasUnauthorizedListings) return

  if (params.action === 'approve') return ResourceError.pcListing.mustBeVerifiedToApprove()
  return ResourceError.pcListing.mustBeVerifiedToReject()
}

function assertBulkUpdateCount(expectedCount: number, actualCount: number): void {
  if (expectedCount === actualCount) return

  ResourceError.pcListing.bulkAlreadyProcessed()
}

export class PcListingBulkModerationService {
  constructor(private readonly prisma: PrismaClient) {}

  async bulkApprove(
    input: BulkApprovePcListingsInput,
  ): Promise<PcBulkModerationResult<PcBulkApproveTarget>> {
    const isModerator = canModerateAsModerator(input.actor.role)
    const isDeveloper = canModerateAsDeveloper(input.actor.role)

    if (!isModerator && !isDeveloper) {
      return ResourceError.pcListing.requiresDeveloperToApprove()
    }

    const processedAt = new Date()

    return this.prisma.$transaction(async (tx) => {
      const repository = new PcListingBulkModerationRepository(tx)
      const pendingListings = await repository.listPendingForBulkApprove(input.pcListingIds)

      if (!isModerator && isDeveloper) {
        await assertDeveloperCanModeratePcListings({
          repository,
          userId: input.actor.userId,
          action: 'approve',
          pcListings: pendingListings,
        })
      }

      if (pendingListings.length === 0) {
        return { pcListings: pendingListings, count: 0, processedAt }
      }

      const result = await repository.approvePendingByIds({
        pcListingIds: pendingListings.map((pcListing) => pcListing.id),
        processedByUserId: input.actor.userId,
        processedAt,
      })

      assertBulkUpdateCount(pendingListings.length, result.count)

      return { pcListings: pendingListings, count: result.count, processedAt }
    })
  }

  async bulkReject(
    input: BulkRejectPcListingsInput,
  ): Promise<PcBulkModerationResult<PcBulkModerationTarget>> {
    const isModerator = canModerateAsModerator(input.actor.role)
    const isDeveloper = canModerateAsDeveloper(input.actor.role)

    if (!isModerator && !isDeveloper) {
      return ResourceError.pcListing.requiresDeveloperToReject()
    }

    const processedAt = new Date()

    return this.prisma.$transaction(async (tx) => {
      const repository = new PcListingBulkModerationRepository(tx)
      const pendingListings = await repository.listPendingForBulkReject(input.pcListingIds)

      if (!isModerator && isDeveloper) {
        await assertDeveloperCanModeratePcListings({
          repository,
          userId: input.actor.userId,
          action: 'reject',
          pcListings: pendingListings,
        })
      }

      if (pendingListings.length === 0) {
        return { pcListings: pendingListings, count: 0, processedAt }
      }

      const result = await repository.rejectPendingByIds({
        pcListingIds: pendingListings.map((pcListing) => pcListing.id),
        processedByUserId: input.actor.userId,
        processedAt,
        processedNotes: input.notes,
      })

      assertBulkUpdateCount(pendingListings.length, result.count)

      return { pcListings: pendingListings, count: result.count, processedAt }
    })
  }
}
