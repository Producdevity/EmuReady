'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'
import { type z } from 'zod'
import {
  Badge,
  Button,
  Card,
  Input,
  LoadingSpinner,
  LocalizedDate,
  Pagination,
  SegmentedTabs,
} from '@/components/ui'
import useDebouncedValue from '@/hooks/useDebouncedValue'
import { api } from '@/lib/api'
import { ListingType } from '@/schemas/common'
import { getApprovalStatusVariant } from '@/utils/badge-colors'
import { ApprovalStatus } from '@orm'

const statusLabels: Record<ApprovalStatus, string> = {
  [ApprovalStatus.APPROVED]: 'Approved',
  [ApprovalStatus.PENDING]: 'Pending',
  [ApprovalStatus.REJECTED]: 'Rejected',
}

export function ReportHistory() {
  const [kind, setKind] = useState<z.output<typeof ListingType>>('handheld')
  const [status, setStatus] = useState<ApprovalStatus>()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search, 300)
  const history = api.reportHistory.get.useQuery(
    {
      kind,
      status,
      search: debouncedSearch,
      page,
      limit: 20,
    },
    { placeholderData: (previous) => previous },
  )
  if (!history.isFetching && !history.error && history.data?.pagination.page === page) {
    const lastPage = Math.max(1, history.data.pagination.pages)
    if (page > lastPage) setPage(lastPage)
  }

  return (
    <Card className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Reports</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Your submitted compatibility reports and their approval status. Only you can see this
          history.
        </p>
      </div>

      <SegmentedTabs
        layoutId="report-history-tabs"
        tabs={[
          { id: 'handheld', label: 'Handheld Reports' },
          { id: 'pc', label: 'PC Reports' },
        ]}
        activeTab={kind}
        onTabChange={(value) => {
          setKind(ListingType.parse(value))
          setPage(1)
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          aria-label="Search your reports by game title"
          placeholder="Search game titles"
          leftIcon={<Search className="h-4 w-4" />}
          maxLength={100}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />
        <Input
          as="select"
          aria-label="Approval status"
          value={status ?? ''}
          onChange={(event) => {
            setStatus(Object.values(ApprovalStatus).find((value) => value === event.target.value))
            setPage(1)
          }}
        >
          <option value="">All statuses</option>
          {Object.values(ApprovalStatus).map((value) => (
            <option key={value} value={value}>
              {statusLabels[value]}
            </option>
          ))}
        </Input>
      </div>

      {history.isPending ? (
        <LoadingSpinner text="Loading your reports…" />
      ) : history.error ? (
        <div role="alert" className="space-y-3">
          <p className="text-red-600 dark:text-red-400">Your report history could not be loaded.</p>
          <Button variant="outline" onClick={() => void history.refetch()}>
            Try again
          </Button>
        </div>
      ) : history.data.items.length === 0 ? (
        <p className="py-8 text-center text-gray-600 dark:text-gray-400">
          No reports match these filters.
        </p>
      ) : (
        <ul
          aria-busy={history.isFetching}
          className="divide-y divide-gray-200 dark:divide-gray-700"
        >
          {history.data.items.map((report) => (
            <li key={report.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:justify-between">
              <div className="min-w-0 space-y-1">
                <h3 className="break-words font-semibold text-gray-900 dark:text-white">
                  {report.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {report.systemName} · {report.emulatorName}
                </p>
                <p className="break-words text-sm text-gray-600 dark:text-gray-400">
                  {report.hardwareLabel}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                <Badge variant={getApprovalStatusVariant(report.status)}>
                  {statusLabels[report.status]}
                </Badge>
                <LocalizedDate
                  date={report.createdAt}
                  format="date"
                  className="text-xs text-gray-500 dark:text-gray-400"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {history.data && !history.error && search === debouncedSearch && (
        <Pagination
          page={history.data.pagination.page}
          totalPages={history.data.pagination.pages}
          totalItems={history.data.pagination.total}
          itemsPerPage={history.data.pagination.limit}
          onPageChange={setPage}
        />
      )}
    </Card>
  )
}
