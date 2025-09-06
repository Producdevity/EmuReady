'use client'

import { Copy, ExternalLink, ShieldOff } from 'lucide-react'
import { useRef, useMemo, useState } from 'react'
import { Button, Modal, Badge, LocalizedDate, useConfirmDialog } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { type UserBanWithDetails } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  ban?: UserBanWithDetails
}

function BanDetailsModal(props: Props) {
  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title="Ban Details" size="lg">
      {props.ban ? <BanDetailsContent ban={props.ban} onClose={props.onClose} /> : null}
    </Modal>
  )
}

function BanDetailsContent(props: { ban: UserBanWithDetails; onClose: () => void }) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const confirm = useConfirmDialog()
  const utils = api.useUtils()
  const unbanNotesRef = useRef<string>('')

  const reportsQuery = api.userBans.getUserReports.useQuery(
    { userId: props.ban.user.id },
    { enabled: true },
  )

  const liftBan = api.userBans.lift.useMutation({
    onSuccess: () => {
      utils.userBans.get.invalidate().catch(console.error)
      utils.userBans.stats.invalidate().catch(console.error)
    },
  })

  const copyToClipboard = async (text?: string, label?: string) => {
    if (!text) return toast.warning('No value to copy')
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(text)
      toast.success(`${label ?? text} copied to clipboard`)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const banBadge = useMemo(() => {
    if (!props.ban.isActive) return { label: 'Lifted', variant: 'default' as const }

    if (props.ban.expiresAt && new Date(props.ban.expiresAt) <= new Date()) {
      return { label: 'Expired', variant: 'warning' as const }
    }
    if (props.ban.expiresAt) return { label: 'Temporary', variant: 'danger' as const }

    return { label: 'Permanent', variant: 'danger' as const }
  }, [props.ban])

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Ban Status */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Ban Status</h3>
          <div className="flex items-center gap-2">
            <Badge variant={banBadge.variant}>{banBadge.label}</Badge>
            {props.ban.isActive && props.ban.expiresAt && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Expires: <LocalizedDate date={props.ban.expiresAt} format="date" />
              </span>
            )}
          </div>
        </div>

        {/* Banned User */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Banned User</h3>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {props.ban.user.name || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{props.ban.user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <Badge>{props.ban.user.role}</Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User ID
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                    {props.ban.user.id.slice(0, 8)}...
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(props.ban.user.id, 'User ID')}
                    className="p-1 h-6 w-6"
                  >
                    <Copy
                      className={`w-3 h-3 ${copiedId === props.ban.user.id ? 'text-green-600' : ''}`}
                    />
                  </Button>
                </div>
              </div>
              {props.ban.user.createdAt && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Member Since
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <LocalizedDate date={props.ban.user.createdAt} format="date" />
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.open(`/admin/users?search=${props.ban.user.email}`, '_blank')
                }}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View in User Management
              </Button>
            </div>
          </div>
        </div>

        {/* Ban Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Ban Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                {props.ban.reason}
              </p>
            </div>
            {props.ban.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Notes
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  {props.ban.notes}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {props.ban.expiresAt ? 'Temporary' : 'Permanent'}
                </p>
              </div>
              {props.ban.expiresAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expires On
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <LocalizedDate date={props.ban.expiresAt} format="dateTime" />
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Reports */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Reports Against User’s Content
          </h3>
          {reportsQuery.isPending ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading reports…</p>
          ) : reportsQuery.error ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load reports: {getErrorMessage(reportsQuery.error)}
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Listing Reports
                </h4>
                {reportsQuery.data && reportsQuery.data.listingReports.length > 0 ? (
                  <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {reportsQuery.data.listingReports.map(
                      (r: RouterOutput['userBans']['getUserReports']['listingReports'][0]) => (
                        <li
                          key={r.id}
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="info">{r.status}</Badge>
                              <span className="font-medium">{r.reason}</span>
                              <span className="text-gray-500 dark:text-gray-400">
                                for game “{r.listing.game.title}”
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              <LocalizedDate date={r.createdAt} format="dateTime" />
                            </span>
                          </div>
                          {r.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {r.description}
                            </p>
                          )}
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No listing reports.</p>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  PC Listing Reports
                </h4>
                {reportsQuery.data && reportsQuery.data.pcListingReports.length > 0 ? (
                  <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {reportsQuery.data.pcListingReports.map(
                      (r: RouterOutput['userBans']['getUserReports']['pcListingReports'][0]) => (
                        <li
                          key={r.id}
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="info">{r.status}</Badge>
                              <span className="font-medium">{r.reason}</span>
                              <span className="text-gray-500 dark:text-gray-400">
                                for game “{r.pcListing.game.title}”
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              <LocalizedDate date={r.createdAt} format="dateTime" />
                            </span>
                          </div>
                          {r.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {r.description}
                            </p>
                          )}
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No PC listing reports.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Administrative Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Administrative Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Banned By
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {props.ban.bannedBy?.name || 'Unknown'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Banned On
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <LocalizedDate date={props.ban.bannedAt} format="dateTime" />
              </p>
            </div>
            {props.ban.unbannedBy && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unbanned By
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {props.ban.unbannedBy.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unbanned On
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {props.ban.unbannedAt ? (
                      <LocalizedDate date={props.ban.unbannedAt} format="dateTime" />
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ban ID
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                  {props.ban.id.slice(0, 8)}...
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(props.ban.id, 'Ban ID')}
                  className="p-1 h-6 w-6"
                >
                  <Copy
                    className={`w-3 h-3 ${copiedId === props.ban.id ? 'text-green-600' : ''}`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <div className="flex-1 max-w-sm">
          {props.ban.isActive && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Unban Notes (optional)
              </label>
              <textarea
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-transparent p-2 text-sm"
                placeholder="Reason for lifting this ban…"
                rows={3}
                onChange={(e) => (unbanNotesRef.current = e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {props.ban.isActive && (
            <Button
              variant="default"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Lift this ban?',
                  description: 'This will mark the ban as inactive and record the unban time.',
                  confirmText: 'Lift Ban',
                })
                if (!ok) return
                liftBan
                  .mutateAsync({ id: props.ban.id, notes: unbanNotesRef.current || undefined })
                  .then(() => props.onClose())
                  .catch((err) => toast.error(`Failed to lift ban: ${getErrorMessage(err)}`))
              }}
              isLoading={liftBan.isPending}
            >
              <ShieldOff className="w-4 h-4 mr-1" /> Lift Ban
            </Button>
          )}
          <Button variant="outline" onClick={props.onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BanDetailsModal
