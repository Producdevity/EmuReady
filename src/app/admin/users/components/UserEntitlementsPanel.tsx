'use client'

import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Input,
  LoadingSpinner,
  useConfirmDialog,
  Dropdown,
} from '@/components/ui'
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
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Entitlements</h4>
        {listQuery.isPending && <LoadingSpinner size="sm" />}
      </div>

      <div className="space-y-2">
        {listQuery.data?.length ? (
          listQuery.data.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between border rounded-md px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <Badge variant={e.status === 'ACTIVE' ? 'primary' : 'default'}>{e.status}</Badge>
                <span className="text-sm">{e.source}</span>
                {e.referenceId && <span className="text-xs text-gray-500">{e.referenceId}</span>}
              </div>
              <div className="flex items-center gap-2">
                {e.status === 'ACTIVE' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRevoke(e.id)}
                    isLoading={revokeMutation.isPending}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500">No entitlements</div>
        )}
      </div>

      <div className="mt-4 border-t pt-4 space-y-3">
        <h5 className="text-sm font-medium">Grant Entitlement</h5>
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            options={[
              { value: EntitlementSource.MANUAL, label: 'MANUAL' },
              { value: EntitlementSource.PLAY, label: 'PLAY' },
              { value: EntitlementSource.PATREON, label: 'PATREON' },
            ]}
            value={source}
            onChange={(v) => setSource(v as EntitlementSource)}
          />
          <Input
            placeholder="Reference (optional)"
            value={referenceId}
            onChange={(e) => setReferenceId((e.target as HTMLInputElement).value)}
            className="w-64"
          />
          <Input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes((e.target as HTMLInputElement).value)}
            className="flex-1"
          />
          <Button onClick={handleGrant} isLoading={grantMutation.isPending}>
            Grant
          </Button>
        </div>
      </div>
    </Card>
  )
}
