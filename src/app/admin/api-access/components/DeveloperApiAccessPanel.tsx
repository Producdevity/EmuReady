import { useEffect, useMemo, useState } from 'react'
import { useAdminTable } from '@/app/admin/hooks'
import { AdminPageLayout, AdminSearchFilters, AdminStatsDisplay } from '@/components/admin'
import {
  Badge,
  Button,
  Card,
  ColumnVisibilityControl,
  LineChart,
  LoadingSpinner,
  useConfirmDialog,
} from '@/components/ui'
import { API_KEY_LIMITS } from '@/data/constants'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility } from '@/hooks'
import { type ColumnDefinition } from '@/hooks/useColumnVisibility'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type ApiKeySortField } from '@/schemas/apiAccess'
import { formatters, getLocale } from '@/utils/date'
import getErrorMessage from '@/utils/getErrorMessage'
import { ms } from '@/utils/time'
import { ApiUsagePeriod } from '@orm'
import { DeveloperKeyTable } from './DeveloperKeyTable'
import { KeySecretBanner } from './KeySecretBanner'
import { KeySecretDialog } from './KeySecretDialog'
import { type DeveloperApiKeyRow, type DeveloperPagination, type KeyDialogState } from './types'
import { getKeyStatusLabel } from '../utils/key-format'

interface Props {
  canCreateKeys: boolean
}

const DEVELOPER_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'prefix', label: 'Prefix', defaultVisible: true },
  { key: 'createdAt', label: 'Created', defaultVisible: true },
  { key: 'lastUsedAt', label: 'Last Used', defaultVisible: true },
  { key: 'monthlyQuota', label: 'Monthly Quota', defaultVisible: true },
  { key: 'weeklyQuota', label: 'Weekly Quota', defaultVisible: false },
  { key: 'burstQuota', label: 'Burst / min', defaultVisible: false },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'requests', label: 'Total Requests', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

const EMPTY_KEY_ROWS: DeveloperApiKeyRow[] = []

export function DeveloperApiAccessPanel(props: Props) {
  const confirmDialog = useConfirmDialog()
  const canCreateKeys = props.canCreateKeys
  const table = useAdminTable<ApiKeySortField>({
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
    defaultLimit: 10,
  })
  const columnVisibility = useColumnVisibility(DEVELOPER_COLUMNS, {
    storageKey: storageKeys.columnVisibility.developerApiKeys,
  })
  const includeRevoked = table.additionalParams.includeRevoked === 'true'
  const locale = getLocale()

  const listQuery = api.apiKeys.listMine.useQuery(
    {
      search: table.debouncedSearch ? table.debouncedSearch : undefined,
      includeRevoked,
      limit: table.limit,
      page: table.page,
      sortField: table.sortField ?? undefined,
      sortDirection: table.sortDirection ?? undefined,
    },
    {
      placeholderData: (previous) => previous,
      refetchOnWindowFocus: false,
    },
  )
  const statsQuery = api.apiKeys.myStats.useQuery(undefined, {
    refetchInterval: ms.minutes(5),
  })

  const keys = listQuery.data?.keys ?? EMPTY_KEY_ROWS
  const pagination = listQuery.data?.pagination as DeveloperPagination | undefined

  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)
  const [dialogState, setDialogState] = useState<KeyDialogState | null>(null)
  const [latestSecret, setLatestSecret] = useState<KeyDialogState | null>(null)

  useEffect(() => {
    if (keys.length === 0) {
      setSelectedKeyId(null)
      return
    }
    if (!selectedKeyId || !keys.some((key) => key.id === selectedKeyId)) {
      setSelectedKeyId(keys[0].id)
    }
  }, [keys, selectedKeyId])

  const selectedKey = keys.find((key) => key.id === selectedKeyId) ?? null
  const selectedKeyStatus = selectedKey ? getKeyStatusLabel(selectedKey) : null

  const monthUsageQuery = api.apiKeys.usage.useQuery(
    {
      id: selectedKeyId ?? '',
      period: ApiUsagePeriod.MONTH,
      limit: API_KEY_LIMITS.USAGE_SERIES_LIMIT,
    },
    { enabled: Boolean(selectedKeyId) },
  )

  const weekUsageQuery = api.apiKeys.usage.useQuery(
    {
      id: selectedKeyId ?? '',
      period: ApiUsagePeriod.WEEK,
      limit: API_KEY_LIMITS.USAGE_SERIES_LIMIT,
    },
    { enabled: Boolean(selectedKeyId) },
  )

  const monthlySummary = useMemo(() => {
    if (!monthUsageQuery.data || monthUsageQuery.data.length === 0) {
      return { lastWindowCount: 0, totalCount: 0 }
    }
    const total = monthUsageQuery.data.reduce((sum, entry) => sum + entry.requestCount, 0)
    const last = monthUsageQuery.data[0]?.requestCount ?? 0
    return { lastWindowCount: last, totalCount: total }
  }, [monthUsageQuery.data])

  const weeklySummary = useMemo(() => {
    if (!weekUsageQuery.data || weekUsageQuery.data.length === 0) {
      return { lastWindowCount: 0, totalCount: 0 }
    }
    const total = weekUsageQuery.data.reduce((sum, entry) => sum + entry.requestCount, 0)
    const last = weekUsageQuery.data[0]?.requestCount ?? 0
    return { lastWindowCount: last, totalCount: total }
  }, [weekUsageQuery.data])

  const usageChartData = useMemo(() => {
    if (!monthUsageQuery.data) return []
    const data = [...monthUsageQuery.data]
    data.sort((a, b) => new Date(a.windowStart).getTime() - new Date(b.windowStart).getTime())
    return data.map((entry) => {
      const entryDate = new Date(entry.windowStart)
      return {
        x: entryDate.getTime(),
        y: entry.requestCount,
        label: `${formatters.date(entryDate, locale)}: ${entry.requestCount} requests`,
      }
    })
  }, [locale, monthUsageQuery.data])

  const createMutation = api.apiKeys.create.useMutation()
  const rotateMutation = api.apiKeys.rotate.useMutation()
  const revokeMutation = api.apiKeys.revoke.useMutation()

  const handleCreateKey = async () => {
    try {
      const result = await createMutation.mutateAsync({})
      await listQuery.refetch()
      const secret = {
        title: 'New API Key',
        plaintext: result.plaintext,
        masked: result.masked,
      }
      setDialogState(secret)
      setLatestSecret(secret)
      setSelectedKeyId(result.apiKey.id)
      toast.success('API key created successfully.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleRotateKey = async (keyId: string) => {
    const confirmed = await confirmDialog({
      title: 'Rotate API key',
      description:
        'Rotating this key immediately revokes the old secret. Update any integrations with the new key.',
      confirmText: 'Rotate key',
    })

    if (!confirmed) return

    try {
      const result = await rotateMutation.mutateAsync({ id: keyId })
      await listQuery.refetch()
      const secret = {
        title: 'API Key Rotated',
        plaintext: result.plaintext,
        masked: result.masked,
      }
      setDialogState(secret)
      setLatestSecret(secret)
      setSelectedKeyId(result.apiKey.id)
      toast.success('API key rotated successfully.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    const confirmed = await confirmDialog({
      title: 'Revoke API key',
      description: 'Revoking this key immediately disables it. This action cannot be undone.',
      confirmText: 'Revoke key',
    })

    if (!confirmed) return

    try {
      await revokeMutation.mutateAsync({ id: keyId })
      await listQuery.refetch()
      if (selectedKeyId === keyId) setSelectedKeyId(null)
      toast.success('API key revoked successfully.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const stats = statsQuery.data

  return (
    <AdminPageLayout
      title="API Access"
      description="Generate and monitor your personal API keys for the EmuReady API."
      headerActions={
        <div className="flex items-center gap-2">
          <ColumnVisibilityControl
            columns={DEVELOPER_COLUMNS}
            columnVisibility={columnVisibility}
          />
          {canCreateKeys ? (
            <Button onClick={handleCreateKey} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create API Key'}
            </Button>
          ) : null}
        </div>
      }
    >
      <AdminStatsDisplay
        stats={[
          { label: 'Active Keys', value: stats?.active ?? 0, color: 'green' },
          { label: 'Total Keys', value: stats?.total ?? 0, color: 'blue' },
          { label: 'Requests (24h)', value: stats?.recentRequests ?? 0, color: 'purple' },
        ]}
        isLoading={statsQuery.isLoading}
      />

      {latestSecret ? (
        <KeySecretBanner
          state={latestSecret}
          description="This secret is shown only once. Copy or download it before dismissing."
          onDismiss={() => setLatestSecret(null)}
          tone="blue"
        />
      ) : null}

      {selectedKey ? (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Monthly usage
            </h3>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {monthlySummary.totalCount.toLocaleString()} /{' '}
              {selectedKey.monthlyQuota.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Last window: {monthlySummary.lastWindowCount.toLocaleString()} requests
            </p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Weekly usage</h3>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {weeklySummary.totalCount.toLocaleString()} /{' '}
              {selectedKey.weeklyQuota.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Current week window: {weeklySummary.lastWindowCount.toLocaleString()} requests
            </p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Burst quota</h3>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {selectedKey.burstQuota.toLocaleString()} / minute
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Burst quota protects the API from sudden spikes. Contact support if you need higher
              throughput.
            </p>
          </Card>
        </div>
      ) : null}

      <AdminSearchFilters<ApiKeySortField>
        table={table}
        searchPlaceholder="Search API keys..."
        onClear={() => {
          table.resetFilters()
          table.setAdditionalParam('includeRevoked', '')
        }}
      >
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={includeRevoked}
            onChange={(event) => {
              table.setAdditionalParam('includeRevoked', event.target.checked ? 'true' : '')
              table.setPage(1)
            }}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Include revoked
        </label>
      </AdminSearchFilters>

      <DeveloperKeyTable
        table={table}
        columnVisibility={columnVisibility}
        keys={keys}
        selectedKeyId={selectedKeyId}
        includeRevoked={includeRevoked}
        isLoading={listQuery.isPending}
        pagination={pagination}
        hasQuery={Boolean(table.debouncedSearch)}
        onSelectKey={(keyId) => setSelectedKeyId(keyId)}
        onRotateKey={handleRotateKey}
        onRevokeKey={handleRevokeKey}
      />

      {selectedKey ? (
        <Card className="mt-8 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Usage timeline (last 30 days)
          </h3>
          {monthUsageQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : (
            <LineChart
              data={usageChartData}
              width={720}
              height={240}
              className="mt-4"
              yAxisLabel="Requests"
              xAxisLabel="Date"
            />
          )}
          <div className="mt-4 grid gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>
              Selected key:{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {selectedKey.name ?? 'Untitled key'}
              </span>
            </span>
            <span>
              Last used:{' '}
              {selectedKey.lastUsedAt
                ? formatters.dateTime(selectedKey.lastUsedAt, locale)
                : 'No requests yet'}
            </span>
            {selectedKeyStatus ? (
              <span className="flex items-center gap-2">
                <span>Status:</span>
                <Badge pill size="sm" variant={selectedKeyStatus.variant}>
                  {selectedKeyStatus.label}
                </Badge>
              </span>
            ) : null}
          </div>
        </Card>
      ) : null}

      <KeySecretDialog state={dialogState} onClose={() => setDialogState(null)} />
    </AdminPageLayout>
  )
}
