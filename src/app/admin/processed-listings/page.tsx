'use client'

import { useState } from 'react'
import {
  type ProcessedReportAccessors,
  ProcessedReportsAdminPage,
  type ProcessedReportHardwareColumn,
} from '@/app/admin/components/processed-reports'
import storageKeys from '@/data/storageKeys'
import { useAdminTable } from '@/hooks/admin'
import { api } from '@/lib/api'
import { logger } from '@/lib/logger'
import toast from '@/lib/toast'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { ApprovalStatus } from '@orm'

type ProcessedListing = RouterOutput['listings']['getProcessed']['listings'][number]
type ProcessedListingSortField =
  | 'processedAt'
  | 'createdAt'
  | 'status'
  | 'game.title'
  | 'game.system.name'
  | 'device'
  | 'emulator.name'
  | 'author.name'

const HANDHELD_HARDWARE_COLUMNS: ProcessedReportHardwareColumn<
  ProcessedListing,
  ProcessedListingSortField
>[] = [
  {
    key: 'device',
    label: 'Device',
    sortField: 'device',
    defaultVisible: true,
    render: (listing) => `${listing.device.brand.name} ${listing.device.modelName}`,
  },
]

const HANDHELD_REPORT_ACCESSORS: ProcessedReportAccessors<ProcessedListing> = {
  getId: (listing) => listing.id,
  getGameTitle: (listing) => listing.game.title,
  getSystemName: (listing) => listing.game.system.name,
  getSystemKey: (listing) => listing.game.system.key,
  getEmulatorName: (listing) => listing.emulator.name,
  getEmulatorLogo: (listing) => listing.emulator.logo,
  getAuthor: (listing) => listing.author,
  getProcessedByName: (listing) => listing.processedByUser?.name,
  getProcessedAt: (listing) => listing.processedAt,
  getProcessedNotes: (listing) => listing.processedNotes,
  getStatus: (listing) => listing.status,
  getEditHref: (listing) => `/admin/listings/${listing.id}/edit`,
  getViewHref: (listing) => `/listings/${listing.id}`,
}

function ProcessedListingsPage() {
  const table = useAdminTable<ProcessedListingSortField>({
    defaultLimit: 20,
    defaultSortField: 'processedAt',
    defaultSortDirection: 'desc',
  })

  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | null>(null)
  const currentUserQuery = api.users.me.useQuery()
  const listingStatsQuery = api.listings.stats.useQuery()
  const processedListingsQuery = api.listings.getProcessed.useQuery({
    page: table.page,
    limit: table.limit,
    filterStatus: filterStatus ?? null,
    search: table.debouncedSearch || null,
    sortField: table.sortField ?? null,
    sortDirection: table.sortDirection ?? null,
  })

  const utils = api.useUtils()
  const invalidateAdminListingViews = async () => {
    await Promise.all([
      utils.listings.getProcessed.invalidate(),
      utils.listings.getPending.invalidate(),
      utils.listings.get.invalidate(),
      utils.listings.stats.invalidate(),
    ])
  }

  const overrideMutation = api.listings.overrideApprovalStatus.useMutation({
    onSuccess: async () => {
      toast.success('Handheld report status updated.')
      await invalidateAdminListingViews()
    },
    onError: (err) => {
      logger.error('Failed to override handheld report status:', err)
      toast.error(`Failed to override handheld report status: ${getErrorMessage(err)}`)
    },
  })

  const resetToPendingMutation = api.listings.resetToPending.useMutation({
    onSuccess: async () => {
      toast.success('Handheld report returned to pending review.')
      await invalidateAdminListingViews()
    },
    onError: (err) => {
      logger.error('Failed to return handheld report to pending review:', err)
      toast.error(`Failed to return handheld report to pending review: ${getErrorMessage(err)}`)
    },
  })

  const processedListings = processedListingsQuery.data?.listings ?? []

  return (
    <ProcessedReportsAdminPage<ProcessedListing, ProcessedListingSortField>
      title="Handheld Processed Reports"
      description="Review approved and rejected handheld compatibility reports. SUPER_ADMINs can override these decisions."
      reportLabel="Handheld Compatibility Report"
      loadingText="Loading processed handheld reports..."
      errorMessage={
        processedListingsQuery.error
          ? `Error loading processed handheld reports: ${processedListingsQuery.error.message}`
          : null
      }
      searchPlaceholder="Search by game, system, device, author, emulator, or notes..."
      storageKey={storageKeys.columnVisibility.adminProcessedListings}
      analyticsContext="admin_processed_handheld_reports_view"
      table={table}
      reports={processedListings}
      pagination={processedListingsQuery.data?.pagination}
      stats={listingStatsQuery.data ?? {}}
      isStatsLoading={listingStatsQuery.isPending}
      isReportsLoading={processedListingsQuery.isPending}
      currentUserPermissions={currentUserQuery.data?.permissions}
      currentUserRole={currentUserQuery.data?.role}
      filterStatus={filterStatus}
      hardwareColumns={HANDHELD_HARDWARE_COLUMNS}
      accessors={HANDHELD_REPORT_ACCESSORS}
      onFilterStatusChange={setFilterStatus}
      onRetry={() => {
        void processedListingsQuery.refetch()
      }}
      onOverrideStatus={async (request) => {
        if (request.newStatus === ApprovalStatus.PENDING) {
          await resetToPendingMutation.mutateAsync({
            listingId: request.report.id,
          } satisfies RouterInput['listings']['resetToPending'])
          return
        }

        await overrideMutation.mutateAsync({
          listingId: request.report.id,
          newStatus: request.newStatus,
          overrideNotes: request.overrideNotes,
        } satisfies RouterInput['listings']['overrideApprovalStatus'])
      }}
      isOverridePending={overrideMutation.isPending || resetToPendingMutation.isPending}
    />
  )
}

export default ProcessedListingsPage
