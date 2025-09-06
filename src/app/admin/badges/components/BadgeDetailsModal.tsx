'use client'

import { Users, Calendar, User, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  Button,
  Badge,
  LoadingSpinner,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  useConfirmDialog,
  LocalizedDate,
} from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'

type BadgeWithDetails = RouterOutput['badges']['byId']

interface Props {
  isOpen: boolean
  onClose: () => void
  badgeId: string | null
  onEdit: (badge: BadgeWithDetails) => void
  onDelete: (badgeId: string) => void
}

export default function BadgeDetailsModal(props: Props) {
  const [isDeleting, setIsDeleting] = useState(false)
  const confirm = useConfirmDialog()

  const badgeQuery = api.badges.byId.useQuery(
    { id: props.badgeId! },
    { enabled: Boolean(props.badgeId) },
  )

  const deleteBadgeMutation = api.badges.delete.useMutation({
    onSuccess: () => {
      toast.success('Badge deleted successfully')
      props.onDelete(props.badgeId!)
      props.onClose()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to delete badge'))
    },
    onSettled: () => {
      setIsDeleting(false)
    },
  })

  const handleDelete = async () => {
    if (!props.badgeId) return

    const confirmed = await confirm({
      title: 'Delete Badge',
      description: 'Are you sure you want to delete this badge? This action cannot be undone.',
      confirmText: 'Delete',
    })

    if (!confirmed) return

    setIsDeleting(true)
    await deleteBadgeMutation.mutateAsync({ id: props.badgeId })
  }

  const handleEdit = () => {
    if (badgeQuery.data) {
      props.onEdit(badgeQuery.data)
    }
  }

  const badge = badgeQuery.data

  if (!props.isOpen || !props.badgeId) return null

  return (
    <Dialog open={props.isOpen} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Badge Details</DialogTitle>
        </DialogHeader>

        {badgeQuery.isPending ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : badgeQuery.error ? (
          <div className="p-4 text-center text-red-600">
            Failed to load badge: {getErrorMessage(badgeQuery.error)}
          </div>
        ) : badge ? (
          <div className="space-y-6">
            {/* Badge Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: badge.color }}
                >
                  {badge.icon || badge.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {badge.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={badge.isActive ? 'success' : 'default'}>
                      {badge.isActive ? (
                        <Eye className="w-3 h-3 mr-1" />
                      ) : (
                        <EyeOff className="w-3 h-3 mr-1" />
                      )}
                      {badge.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {badge._count.userBadges} assignment
                      {badge._count.userBadges !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {badge.description && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">{badge.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Color:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: badge.color }}
                    />
                    <span className="font-mono">{badge.color}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Icon:</span>
                  <p className="mt-1">{badge.icon || 'None'}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Created by:</span>
                  <p className="mt-1">{badge.creator.name || badge.creator.email}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Created at:</span>
                  <p className="mt-1">
                    <LocalizedDate date={badge.createdAt} format="date" />
                  </p>
                </div>
              </div>
            </div>

            {/* User Assignments */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Assignments ({badge.userBadges.length})
              </h4>

              {badge.userBadges.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No users have been assigned this badge yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {badge.userBadges.map((userBadge) => (
                    <div
                      key={userBadge.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {userBadge.user.name || userBadge.user.email}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {userBadge.user.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          <LocalizedDate date={userBadge.assignedAt} format="date" />
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          by {userBadge.assignedByUser.name || userBadge.assignedByUser.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Close
          </Button>
          {badge && (
            <>
              <Button onClick={handleEdit}>Edit Badge</Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting || badge._count.userBadges > 0}
                    isLoading={isDeleting}
                  >
                    Delete
                  </Button>
                </TooltipTrigger>
                {badge._count.userBadges > 0 && (
                  <TooltipContent>Cannot delete badge with active assignments</TooltipContent>
                )}
              </Tooltip>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
