import { useState } from 'react'
import { useAdminTable } from '@/app/admin/hooks'
import { AdminPageLayout, AdminSearchFilters, AdminStatsDisplay } from '@/components/admin'
import { Button, Card, ColumnVisibilityControl, useConfirmDialog } from '@/components/ui'
import storageKeys from '@/data/storageKeys'
import { useColumnVisibility } from '@/hooks'
import { type ColumnDefinition } from '@/hooks/useColumnVisibility'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type ApiKeySortField } from '@/schemas/apiAccess'
import getErrorMessage from '@/utils/getErrorMessage'
import { hasRolePermission } from '@/utils/permissions'
import { ms } from '@/utils/time'
import { Role } from '@orm'
import { AdminCreateKeyForm, type AdminCreateFormState } from './AdminCreateKeyForm'
import { AdminKeyTable } from './AdminKeyTable'
import { AdminQuotaDialog, type QuotaFormState } from './AdminQuotaDialog'
import { KeySecretBanner } from './KeySecretBanner'
import { KeySecretDialog } from './KeySecretDialog'
import { SystemKeySummary } from './SystemKeySummary'
import { type AdminApiKeyRow, type ApiPagination, type KeyDialogState } from './types'

const ADMIN_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'prefix', label: 'Prefix', defaultVisible: true },
  { key: 'owner', label: 'Owner', defaultVisible: true },
  { key: 'createdAt', label: 'Created', defaultVisible: true },
  { key: 'lastUsedAt', label: 'Last Used', defaultVisible: true },
  { key: 'monthlyQuota', label: 'Monthly Quota', defaultVisible: true },
  { key: 'weeklyQuota', label: 'Weekly Quota', defaultVisible: false },
  { key: 'burstQuota', label: 'Burst / min', defaultVisible: false },
  { key: 'requests', label: 'Total Requests', defaultVisible: false },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

const EMPTY_KEY_ROWS: AdminApiKeyRow[] = []

interface Props {
  userRole: Role
}

export function AdminApiAccessPanel(props: Props) {
  const confirmDialog = useConfirmDialog()
  const table = useAdminTable<ApiKeySortField>({
    defaultSortField: 'createdAt',
    defaultSortDirection: 'desc',
  })
  const columnVisibility = useColumnVisibility(ADMIN_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminApiKeys,
  })
  const includeRevoked = table.additionalParams.includeRevoked === 'true'

  const listQuery = api.apiKeys.adminList.useQuery(
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

  const statsQuery = api.apiKeys.adminStats.useQuery(undefined, {
    refetchInterval: ms.minutes(5),
  })
  const canManageSystemKeys = hasRolePermission(props.userRole, Role.SUPER_ADMIN)
  const systemKeysQuery = api.apiKeys.adminSystemKeys.useQuery(undefined, {
    refetchInterval: ms.minutes(10),
    enabled: canManageSystemKeys,
  })

  const createMutation = api.apiKeys.adminCreate.useMutation()
  const rotateMutation = api.apiKeys.adminRotate.useMutation()
  const revokeMutation = api.apiKeys.adminRevoke.useMutation()
  const quotaMutation = api.apiKeys.adminUpdateQuota.useMutation()

  const keys = listQuery.data?.keys ?? EMPTY_KEY_ROWS
  const pagination = listQuery.data?.pagination as ApiPagination | undefined

  const [quotaKeyId, setQuotaKeyId] = useState<string | null>(null)
  const [dialogState, setDialogState] = useState<KeyDialogState | null>(null)
  const [latestSecret, setLatestSecret] = useState<KeyDialogState | null>(null)

  const handleCreateAdminKey = async (input: AdminCreateFormState) => {
    try {
      const payload = {
        userId: input.userId,
        name: input.name,
        expiresAt: input.expiresAt ?? undefined,
        isSystemKey: input.isSystemKey,
        ...(typeof input.monthlyQuota === 'number'
          ? {
              monthlyQuota: input.monthlyQuota,
              weeklyQuota: input.weeklyQuota,
              burstQuota: input.burstQuota,
            }
          : {}),
      }

      const result = await createMutation.mutateAsync(payload)
      await listQuery.refetch()
      const secret = {
        title: 'API Key Created',
        plaintext: result.plaintext,
        masked: result.masked,
      }
      setDialogState(secret)
      setLatestSecret(secret)
      toast.success('API key created successfully.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleRotateKey = async (keyId: string) => {
    const confirmed = await confirmDialog({
      title: 'Rotate API key',
      description: 'Rotating will revoke the existing secret immediately.',
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
      toast.success('API key rotated successfully.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    const confirmed = await confirmDialog({
      title: 'Revoke API key',
      description: 'The key will be disabled immediately for all integrations.',
      confirmText: 'Revoke key',
    })
    if (!confirmed) return

    try {
      await revokeMutation.mutateAsync({ id: keyId })
      await listQuery.refetch()
      toast.success('API key revoked successfully.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleSubmitQuota = async (state: QuotaFormState) => {
    if (!state.id) return

    try {
      await quotaMutation.mutateAsync({
        id: state.id,
        monthlyQuota: state.monthlyQuota,
        weeklyQuota: state.weeklyQuota,
        burstQuota: state.burstQuota,
        expiresAt: state.expiresAt ?? undefined,
      })
      await listQuery.refetch()
      toast.success('Quotas updated successfully.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const adminStats = statsQuery.data

  return (
    <AdminPageLayout
      title="API Access"
      description="Provision developer API keys, monitor consumption, and enforce per-key quotas."
      headerActions={
        <div className="flex items-center gap-2">
          <ColumnVisibilityControl columns={ADMIN_COLUMNS} columnVisibility={columnVisibility} />
          <Button
            variant="outline"
            onClick={() => window.open('/admin/api-access/developer', '_blank')}
          >
            View developer dashboard
          </Button>
        </div>
      }
    >
      <AdminStatsDisplay
        stats={[
          { label: 'Total Keys', value: adminStats?.total ?? 0, color: 'blue' },
          { label: 'Active Keys', value: adminStats?.active ?? 0, color: 'green' },
          { label: 'System Keys', value: adminStats?.system ?? 0, color: 'purple' },
          { label: 'Requests (24h)', value: adminStats?.recentRequests ?? 0, color: 'orange' },
        ]}
        isLoading={statsQuery.isLoading}
      />

      {latestSecret ? (
        <KeySecretBanner
          state={latestSecret}
          description="This secret is only displayed once. Copy or securely store it before dismissing."
          onDismiss={() => setLatestSecret(null)}
          tone="amber"
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr] mb-6">
        <Card className="p-4">
          <AdminCreateKeyForm
            onSubmit={handleCreateAdminKey}
            isSubmitting={createMutation.isPending}
            canCreateSystemKey={canManageSystemKeys}
          />
        </Card>
        <SystemKeySummary
          canManageSystemKeys={canManageSystemKeys}
          isLoading={systemKeysQuery.isLoading}
          keys={systemKeysQuery.data ?? []}
        />
      </div>

      <AdminSearchFilters<ApiKeySortField>
        table={table}
        searchPlaceholder="Search by name, prefix, or user email"
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

      <AdminKeyTable
        table={table}
        columnVisibility={columnVisibility}
        keys={keys}
        includeRevoked={includeRevoked}
        isLoading={listQuery.isPending}
        pagination={pagination}
        hasQuery={Boolean(table.debouncedSearch)}
        onRotateKey={handleRotateKey}
        onRevokeKey={handleRevokeKey}
        onOpenQuotaDialog={(keyId) => setQuotaKeyId(keyId)}
      />

      {quotaKeyId ? (
        <AdminQuotaDialog
          keyId={quotaKeyId}
          keys={keys}
          isSubmitting={quotaMutation.isPending}
          onClose={() => setQuotaKeyId(null)}
          onSubmit={handleSubmitQuota}
        />
      ) : null}

      <KeySecretDialog state={dialogState} onClose={() => setDialogState(null)} />
    </AdminPageLayout>
  )
}
