'use client'

import { Copy, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Button, Modal, Badge, LocalizedDate } from '@/components/ui'
import toast from '@/lib/toast'
import { type UserBanWithDetails } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  ban?: UserBanWithDetails
}

function BanDetailsModal(props: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  if (!props.ban) return null

  const { ban } = props

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(text)
      toast.success(`${label} copied to clipboard`)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const getBanStatusBadgeVariant = () => {
    if (!ban.isActive) return 'default'
    if (ban.expiresAt && new Date(ban.expiresAt) <= new Date()) return 'warning'
    return 'danger'
  }

  const getBanStatusText = () => {
    if (!ban.isActive) return 'Lifted'
    if (ban.expiresAt && new Date(ban.expiresAt) <= new Date()) return 'Expired'
    if (ban.expiresAt) return 'Temporary'
    return 'Permanent'
  }

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title="Ban Details" size="lg">
      <div className="space-y-6">
        {/* Ban Status */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Ban Status</h3>
          <div className="flex items-center gap-2">
            <Badge variant={getBanStatusBadgeVariant()}>{getBanStatusText()}</Badge>
            {ban.isActive && ban.expiresAt && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Expires: <LocalizedDate date={ban.expiresAt} format="date" />
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
                  {ban.user.name || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{ban.user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <Badge>{ban.user.role}</Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User ID
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                    {ban.user.id.slice(0, 8)}...
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(ban.user.id, 'User ID')}
                    className="p-1 h-6 w-6"
                  >
                    <Copy
                      className={`w-3 h-3 ${copiedId === ban.user.id ? 'text-green-600' : ''}`}
                    />
                  </Button>
                </div>
              </div>
              {ban.user.createdAt && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Member Since
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <LocalizedDate date={ban.user.createdAt} format="date" />
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.open(`/admin/users?search=${ban.user.email}`, '_blank')
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
                {ban.reason}
              </p>
            </div>
            {ban.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Notes
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  {ban.notes}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {ban.expiresAt ? 'Temporary' : 'Permanent'}
                </p>
              </div>
              {ban.expiresAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expires On
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <LocalizedDate date={ban.expiresAt} format="dateTime" />
                  </p>
                </div>
              )}
            </div>
          </div>
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
                {ban.bannedBy?.name || 'Unknown'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Banned On
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <LocalizedDate date={ban.bannedAt} format="dateTime" />
              </p>
            </div>
            {ban.unbannedBy && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unbanned By
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {ban.unbannedBy.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unbanned On
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {ban.unbannedAt ? (
                      <LocalizedDate date={ban.unbannedAt} format="dateTime" />
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
                  {ban.id.slice(0, 8)}...
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(ban.id, 'Ban ID')}
                  className="p-1 h-6 w-6"
                >
                  <Copy className={`w-3 h-3 ${copiedId === ban.id ? 'text-green-600' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button variant="outline" onClick={props.onClose}>
          Close
        </Button>
      </div>
    </Modal>
  )
}

export default BanDetailsModal
