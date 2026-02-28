'use client'

import { useState } from 'react'
import { Badge, Button, Input, LoadingSpinner, useConfirmDialog, Dropdown } from '@/components/ui'
import { api } from '@/lib/api'
import { EntitlementSource } from '@orm'

interface Props {
  userId: string
}

export default function UserEntitlementsPanel(props: Props) {
  const utils = api.useUtils()
  const confirm = useConfirmDialog()
  const listQuery = api.adminEntitlements.listByUser.useQuery({ userId: props.userId })
  const grantMutation = api.adminEntitlements.grant.useMutation({
    onSuccess: () => {
      utils.adminEntitlements.listByUser.invalidate({ userId: props.userId }).catch(console.error)
    },
  })
  const revokeMutation = api.adminEntitlements.revoke.useMutation({
    onSuccess: () => {
      utils.adminEntitlements.listByUser.invalidate({ userId: props.userId }).catch(console.error)
    },
  })

  const [source, setSource] = useState<EntitlementSource>(EntitlementSource.MANUAL)
  const [referenceId, setReferenceId] = useState('')
  const [notes, setNotes] = useState('')

  async function handleGrant() {
    await grantMutation.mutateAsync({
      userId: props.userId,
      source,
      referenceId: referenceId || undefined,
      notes: notes || undefined,
    })
    setReferenceId('')
    setNotes('')
  }

  async function handleRevoke(entitlementId: string) {
    const ok = await confirm({
      title: 'Revoke Entitlement',
      description: "This will remove the user's access to app downloads. Continue?",
      confirmText: 'Revoke',
    })
    if (!ok) return
    await revokeMutation.mutateAsync({ entitlementId })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Entitlements</span>
        {listQuery.isPending && <LoadingSpinner size="sm" />}
      </div>

      <div className="space-y-1.5">
        {listQuery.data?.length ? (
          listQuery.data.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1.5"
            >
              <div className="flex items-center gap-2">
                <Badge size="sm" variant={e.status === 'ACTIVE' ? 'primary' : 'default'}>
                  {e.status}
                </Badge>
                <span className="text-xs text-gray-700 dark:text-gray-300">{e.source}</span>
                {e.referenceId && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{e.referenceId}</span>
                )}
              </div>
              {e.status === 'ACTIVE' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRevoke(e.id)}
                  isLoading={revokeMutation.isPending}
                  className="h-7 px-2 text-xs"
                >
                  Revoke
                </Button>
              )}
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">No entitlements</p>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Grant Entitlement
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            options={[
              { value: EntitlementSource.MANUAL, label: 'MANUAL' },
              { value: EntitlementSource.PLAY, label: 'PLAY' },
              { value: EntitlementSource.PATREON, label: 'PATREON' },
            ]}
            value={source}
            onChange={(v) => setSource(v as EntitlementSource)}
            triggerClassName="py-1.5 text-xs"
          />
          <Input
            placeholder="Reference (optional)"
            value={referenceId}
            onChange={(e) => setReferenceId((e.target as HTMLInputElement).value)}
            className="h-8 text-xs w-48"
          />
          <Input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes((e.target as HTMLInputElement).value)}
            className="h-8 text-xs flex-1"
          />
          <Button
            size="sm"
            onClick={handleGrant}
            isLoading={grantMutation.isPending}
            className="h-8 text-xs"
          >
            Grant
          </Button>
        </div>
      </div>
    </div>
  )
}
