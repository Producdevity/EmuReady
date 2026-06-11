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

type ProcessedPcListing = RouterOutput['pcListings']['getProcessed']['pcListings'][number]
type ProcessedPcListingSortField =
  | 'processedAt'
  | 'createdAt'
  | 'status'
  | 'game.title'
  | 'game.system.name'
  | 'cpu'
  | 'gpu'
  | 'emulator.name'
  | 'author.name'

function getGpuLabel(listing: ProcessedPcListing): string {
  return listing.gpu ? `${listing.gpu.brand.name} ${listing.gpu.modelName}` : 'Integrated / N/A'
}

const PC_HARDWARE_COLUMNS: ProcessedReportHardwareColumn<
  ProcessedPcListing,
  ProcessedPcListingSortField
>[] = [
  {
    key: 'cpu',
    label: 'CPU',
    sortField: 'cpu',
    defaultVisible: true,
    render: (listing) => `${listing.cpu.brand.name} ${listing.cpu.modelName}`, // TODO: replace with     render: (listing) => getCpuLabel(listing.cpu),
  },
  {
    key: 'gpu',
    label: 'GPU',
    sortField: 'gpu',
    defaultVisible: true,
    render: getGpuLabel,
  },
]

const PC_REPORT_ACCESSORS: ProcessedReportAccessors<ProcessedPcListing> = {
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
  getEditHref: (listing) => `/admin/pc-listings/${listing.id}/edit`,
  getViewHref: (listing) => `/pc-listings/${listing.id}`,
}

function PcProcessedListingsPage() {
  const table = useAdminTable<ProcessedPcListingSortField>({
    defaultLimit: 20,
    defaultSortField: 'processedAt',
    defaultSortDirection: 'desc',
  })

  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | null>(null)
  const currentUserQuery = api.users.me.useQuery()
  const pcListingsStatsQuery = api.pcListings.stats.useQuery()
  const processedPcListingsQuery = api.pcListings.getProcessed.useQuery({
    page: table.page,
    limit: table.limit,
    filterStatus: filterStatus ?? null,
    search: table.debouncedSearch || null,
    sortField: table.sortField ?? null,
    sortDirection: table.sortDirection ?? null,
  })

  const utils = api.useUtils()
  const invalidateAdminPcListingViews = async () => {
    await Promise.all([
      utils.pcListings.getProcessed.invalidate(),
      utils.pcListings.pending.invalidate(),
      utils.pcListings.get.invalidate(),
      utils.pcListings.stats.invalidate(),
    ])
  }

  const overrideMutation = api.pcListings.overrideStatus.useMutation({
    onSuccess: async () => {
      toast.success('PC report status updated.')
      await invalidateAdminPcListingViews()
    },
    onError: (err) => {
      logger.error('Failed to override PC report status:', err)
      toast.error(`Failed to override PC report status: ${getErrorMessage(err)}`)
    },
  })

  const resetToPendingMutation = api.pcListings.resetToPending.useMutation({
    onSuccess: async () => {
      toast.success('PC report returned to pending review.')
      await invalidateAdminPcListingViews()
    },
    onError: (err) => {
      logger.error('Failed to return PC report to pending review:', err)
      toast.error(`Failed to return PC report to pending review: ${getErrorMessage(err)}`)
    },
  })

  const processedPcListings = processedPcListingsQuery.data?.pcListings ?? []

  return (
    <ProcessedReportsAdminPage<ProcessedPcListing, ProcessedPcListingSortField>
      title="PC Processed Reports"
      description="Review approved and rejected PC compatibility reports. SUPER_ADMINs can override these decisions."
      reportLabel="PC Compatibility Report"
      loadingText="Loading processed PC reports..."
      errorMessage={
        processedPcListingsQuery.error
          ? `Error loading processed PC reports: ${processedPcListingsQuery.error.message}`
          : null
      }
      searchPlaceholder="Search by game, system, CPU, GPU, author, emulator, or notes..."
      storageKey={storageKeys.columnVisibility.adminPcProcessedListings}
      analyticsContext="admin_processed_pc_reports_view"
      table={table}
      reports={processedPcListings}
      pagination={processedPcListingsQuery.data?.pagination}
      stats={pcListingsStatsQuery.data ?? {}}
      isStatsLoading={pcListingsStatsQuery.isPending}
      isReportsLoading={processedPcListingsQuery.isPending}
      currentUserPermissions={currentUserQuery.data?.permissions}
      currentUserRole={currentUserQuery.data?.role}
      filterStatus={filterStatus}
      hardwareColumns={PC_HARDWARE_COLUMNS}
      accessors={PC_REPORT_ACCESSORS}
      onFilterStatusChange={setFilterStatus}
      onRetry={() => {
        void processedPcListingsQuery.refetch()
      }}
      onOverrideStatus={async (request) => {
        if (request.newStatus === ApprovalStatus.PENDING) {
          await resetToPendingMutation.mutateAsync({
            pcListingId: request.report.id,
          } satisfies RouterInput['pcListings']['resetToPending'])
          return
        }

        await overrideMutation.mutateAsync({
          pcListingId: request.report.id,
          newStatus: request.newStatus,
          overrideNotes: request.overrideNotes,
        } satisfies RouterInput['pcListings']['overrideStatus'])
      }}
      isOverridePending={overrideMutation.isPending || resetToPendingMutation.isPending}
    />
  )
}

export default PcProcessedListingsPage
