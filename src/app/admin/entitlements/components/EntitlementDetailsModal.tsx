'use client'

import { useMemo } from 'react'
import { Badge, Button, Card, Modal } from '@/components/ui'
import { DeleteButton } from '@/components/ui/table-buttons'

interface Props {
  isOpen: boolean
  onClose: () => void
  row: {
    id: string
    source: 'PLAY' | 'PATREON' | 'MANUAL'
    status: 'ACTIVE' | 'REVOKED'
    referenceId: string | null
    grantedAt: string | Date
    revokedAt: string | Date | null
    notes?: string | null
    user: { id: string; email: string | null; name: string | null; role: string }
  }
  onRevoke: (id: string) => Promise<void>
  onRestore: (id: string) => Promise<void>
  isMutating?: boolean
}

export default function EntitlementDetailsModal(props: Props) {
  const granted = useMemo(
    () => new Date(props.row.grantedAt).toLocaleString(),
    [props.row.grantedAt],
  )
  const revoked = useMemo(
    () => (props.row.revokedAt ? new Date(props.row.revokedAt).toLocaleString() : '—'),
    [props.row.revokedAt],
  )

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title="Entitlement details" size="lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <div className="text-xs text-gray-500 dark:text-gray-400">User</div>
          <div className="mt-1">
            <a
              href={`/admin/users?userId=${props.row.user.id}`}
              className="text-blue-600 hover:underline"
            >
              {props.row.user.name ?? '—'}
            </a>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {props.row.user.email ?? '—'}
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-xs text-gray-500 dark:text-gray-400">Source</div>
          <div className="mt-1">
            <Badge pill>{props.row.source}</Badge>
          </div>
        </Card>

        <Card>
          <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
          <div className="mt-1">
            <Badge variant={props.row.status === 'ACTIVE' ? 'primary' : 'default'} pill>
              {props.row.status}
            </Badge>
          </div>
        </Card>

        <Card>
          <div className="text-xs text-gray-500 dark:text-gray-400">Reference</div>
          <div className="mt-1 font-mono text-xs break-all">{props.row.referenceId ?? '—'}</div>
        </Card>

        <Card>
          <div className="text-xs text-gray-500 dark:text-gray-400">Granted</div>
          <div className="mt-1">{granted}</div>
        </Card>

        <Card>
          <div className="text-xs text-gray-500 dark:text-gray-400">Revoked</div>
          <div className="mt-1">{revoked}</div>
        </Card>

        {props.row.notes && (
          <Card className="sm:col-span-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">Notes</div>
            <div className="mt-1 text-sm whitespace-pre-wrap">{props.row.notes}</div>
          </Card>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Revoke frees the reference (GPA.*) to be claimed by another account.
        </div>
        <div className="flex items-center gap-2">
          {props.row.status === 'ACTIVE' ? (
            <DeleteButton
              title="Revoke"
              onClick={async () => {
                await props.onRevoke(props.row.id)
              }}
              disabled={props.isMutating}
            />
          ) : (
            <Button
              variant="primary"
              onClick={async () => props.onRestore(props.row.id)}
              disabled={props.isMutating}
            >
              Restore
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
