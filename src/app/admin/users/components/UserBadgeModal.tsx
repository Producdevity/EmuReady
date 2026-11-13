'use client'

import { Award, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Button,
  ColorPicker,
  LocalizedDate,
  Pagination,
  SelectInput,
} from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { TailwindColor } from '@orm'

type User = Pick<RouterOutput['users']['get']['users'][number], 'id' | 'name' | 'email'>

interface Props {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSuccess: () => void
}

export default function UserBadgeModal(props: Props) {
  const assignBadgeMutation = api.badges.assignToUser.useMutation()
  const removeBadgeMutation = api.badges.removeFromUser.useMutation()
  const isPending = assignBadgeMutation.isPending || removeBadgeMutation.isPending

  function closeModal() {
    if (!isPending) props.onClose()
  }

  return (
    <Dialog
      open={props.isOpen && Boolean(props.user)}
      onOpenChange={(open) => !open && closeModal()}
    >
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-hidden"
        showCloseButton={!isPending}
      >
        {props.user && (
          <UserBadgeForm
            key={`${props.isOpen}:${props.user.id}`}
            user={props.user}
            onClose={closeModal}
            onSuccess={props.onSuccess}
            assignBadgeMutation={assignBadgeMutation}
            removeBadgeMutation={removeBadgeMutation}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type FormProps = Omit<Props, 'isOpen' | 'user'> & {
  user: User
  assignBadgeMutation: ReturnType<typeof api.badges.assignToUser.useMutation>
  removeBadgeMutation: ReturnType<typeof api.badges.removeFromUser.useMutation>
}

function UserBadgeForm(props: FormProps) {
  const active = useRef(false)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  const selectorId = useId()
  const utils = api.useUtils()
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<TailwindColor>(TailwindColor.blue)
  const [page, setPage] = useState(1)
  const badgesQuery = api.badges.get.useQuery(
    { isActive: true, limit: 100, page, sortField: 'name', sortDirection: 'asc' },
    { placeholderData: (previous) => previous },
  )
  const userBadgesQuery = api.users.getUserById.useQuery({ userId: props.user.id })
  const isPending = props.assignBadgeMutation.isPending || props.removeBadgeMutation.isPending
  const fieldsDisabled =
    isPending ||
    !badgesQuery.data ||
    !userBadgesQuery.data ||
    badgesQuery.isFetching ||
    userBadgesQuery.isFetching

  if (!badgesQuery.isFetching && !badgesQuery.error && badgesQuery.data?.pagination.page === page) {
    const lastPage = Math.max(1, badgesQuery.data.pagination.pages)
    if (page > lastPage) {
      setPage(lastPage)
      setSelectedBadgeId(null)
    }
  }

  async function handleAssignBadge() {
    if (fieldsDisabled || !selectedBadgeId) return
    try {
      await props.assignBadgeMutation.mutateAsync({
        userId: props.user.id,
        badgeId: selectedBadgeId,
        color: selectedColor,
      })
    } catch (error) {
      toast.error(
        `Failed to assign badge to ${props.user.name ?? props.user.email}: ${getErrorMessage(error)}`,
      )
      return
    }
    toast.success(`Badge assigned to ${props.user.name ?? props.user.email}`)
    props.onSuccess()
    void utils.users.getUserById.invalidate({ userId: props.user.id }).catch(console.error)
    if (active.current) {
      setSelectedBadgeId(null)
      setSelectedColor(TailwindColor.blue)
    }
  }

  async function handleRemoveBadge(userBadgeId: string) {
    if (fieldsDisabled) return
    try {
      await props.removeBadgeMutation.mutateAsync({ userId: props.user.id, userBadgeId })
    } catch (error) {
      toast.error(
        `Failed to remove badge from ${props.user.name ?? props.user.email}: ${getErrorMessage(error)}`,
      )
      return
    }
    toast.success(`Badge removed from ${props.user.name ?? props.user.email}`)
    props.onSuccess()
    void utils.users.getUserById.invalidate({ userId: props.user.id }).catch(console.error)
  }

  const badges = badgesQuery.data?.badges ?? []
  const userBadges = userBadgesQuery.data?.userBadges ?? []
  const assignedBadgeIds = new Set(userBadges.map((badge) => badge.badge.id))
  const availableBadges = badges.filter((badge) => !assignedBadgeIds.has(badge.id))

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Manage Badges for {props.user.name || props.user.email}
        </DialogTitle>
        <DialogDescription>
          Choose a badge and display color, or remove an assigned badge.
        </DialogDescription>
      </DialogHeader>

      <fieldset disabled={fieldsDisabled} className="min-w-0 space-y-6 overflow-y-auto">
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
                    aria-label={`Remove ${userBadge.badge.name} badge`}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBadge(userBadge.id)}
                    disabled={isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {availableBadges.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Assign New Badge
            </h3>
            <div className="space-y-3">
              <SelectInput
                id={selectorId}
                label="Badge"
                value={selectedBadgeId ?? ''}
                onChange={(event) => setSelectedBadgeId(event.target.value || null)}
                options={availableBadges}
              />

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
                icon={Award}
                onClick={handleAssignBadge}
                isLoading={props.assignBadgeMutation.isPending}
                disabled={!selectedBadgeId || isPending}
                className="w-full"
              >
                Assign Badge
              </Button>
            </div>
          </div>
        )}

        {availableBadges.length === 0 && userBadges.length > 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400">No unassigned badges on this page.</p>
          </div>
        )}
        {badgesQuery.data && (
          <Pagination
            page={badgesQuery.data.pagination.page}
            totalPages={badgesQuery.data.pagination.pages}
            totalItems={badgesQuery.data.pagination.total}
            itemsPerPage={badgesQuery.data.pagination.limit}
            onPageChange={(nextPage) => {
              if (nextPage !== page) {
                setPage(nextPage)
                setSelectedBadgeId(null)
              }
            }}
          />
        )}
      </fieldset>

      <DialogFooter>
        <Button variant="ghost" onClick={props.onClose} disabled={isPending}>
          Close
        </Button>
      </DialogFooter>
    </>
  )
}
