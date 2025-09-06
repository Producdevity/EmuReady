'use client'

import { Award, X } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  Button,
  ColorPicker,
  LocalizedDate,
} from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import { type TailwindColor } from '@orm'

interface User {
  id: string
  name: string | null
  email: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSuccess: () => void
}

export default function UserBadgeModal(props: Props) {
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<TailwindColor>('blue')

  // Fetch all active badges
  const badgesQuery = api.badges.get.useQuery(
    // TODO: Implement pagination if needed, probably not needed for badges
    { isActive: true, limit: 100 },
    { enabled: props.isOpen },
  )

  // Fetch user's current badges
  const userBadgesQuery = api.users.getUserById.useQuery(
    { userId: props.user?.id ?? '' },
    { enabled: props.isOpen && Boolean(props.user?.id) },
  )

  // Badge assignment mutations
  const assignBadgeMutation = api.badges.assignToUser.useMutation({
    onSuccess: () => {
      toast.success('Badge assigned successfully')
      props.onSuccess()
      userBadgesQuery.refetch().catch(console.error)
      setSelectedBadgeId(null)
      setSelectedColor('blue')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to assign badge'))
    },
  })

  const removeBadgeMutation = api.badges.removeFromUser.useMutation({
    onSuccess: () => {
      toast.success('Badge removed successfully')
      props.onSuccess()
      userBadgesQuery.refetch().catch(console.error)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to remove badge'))
    },
  })

  const handleAssignBadge = async () => {
    if (!props.user?.id || !selectedBadgeId) return

    await assignBadgeMutation.mutateAsync({
      userId: props.user.id,
      badgeId: selectedBadgeId,
      color: selectedColor,
    })
  }

  const handleRemoveBadge = async (userBadgeId: string) => {
    if (!props.user?.id) return

    await removeBadgeMutation.mutateAsync({
      userId: props.user.id,
      userBadgeId,
    })
  }

  const badges = badgesQuery.data?.badges || []
  const userBadges = userBadgesQuery.data?.userBadges || []
  const assignedBadgeIds = new Set(userBadges.map((ub) => ub.badge.id))
  const availableBadges = badges.filter((badge) => !assignedBadgeIds.has(badge.id))

  return (
    <Dialog open={props.isOpen} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Manage Badges for {props.user?.name || props.user?.email}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto">
          {/* Current Badges */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Current Badges ({userBadges.length})
            </h3>
            {userBadges.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                No badges assigned yet
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {userBadges.map((userBadge) => (
                  <div
                    key={userBadge.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: userBadge.color || userBadge.badge.color }}
                      >
                        {userBadge.badge.icon || userBadge.badge.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {userBadge.badge.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Assigned <LocalizedDate date={userBadge.assignedAt} format="date" />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Color: {userBadge.color}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveBadge(userBadge.id)}
                      disabled={removeBadgeMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign New Badge */}
          {availableBadges.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Assign New Badge
              </h3>
              <div className="space-y-3">
                <select
                  value={selectedBadgeId || ''}
                  onChange={(e) => setSelectedBadgeId(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a badge to assign...</option>
                  {availableBadges.map((badge) => (
                    <option key={badge.id} value={badge.id}>
                      {badge.name}
                    </option>
                  ))}
                </select>

                {selectedBadgeId && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {(() => {
                      const selectedBadge = badges.find((b) => b.id === selectedBadgeId)
                      if (!selectedBadge) return null
                      return (
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: selectedBadge.color }}
                          >
                            {selectedBadge.icon || selectedBadge.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {selectedBadge.name}
                            </div>
                            {selectedBadge.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedBadge.description}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                <ColorPicker
                  selectedColor={selectedColor}
                  onColorChange={setSelectedColor}
                  label="Badge Color"
                  className="mb-4"
                />

                <Button
                  onClick={handleAssignBadge}
                  isLoading={assignBadgeMutation.isPending}
                  disabled={!selectedBadgeId || assignBadgeMutation.isPending}
                  className="w-full"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Assign Badge
                </Button>
              </div>
            </div>
          )}

          {availableBadges.length === 0 && userBadges.length > 0 && (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400">
                All available badges have been assigned to this user.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
