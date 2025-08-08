'use client'

import { useUser } from '@clerk/nextjs'
import { Search, AlertTriangle, ShieldOff } from 'lucide-react'
import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Button, Modal, Badge } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { PERMISSIONS } from '@/utils/permission-system'
import { Role } from '@orm'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId?: string
}

type UserSearchResult = RouterOutput['users']['searchUsers'][number]

function CreateBanModal(props: Props) {
  const { user: clerkUser } = useUser()
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isPermanent, setIsPermanent] = useState(true)
  const [expirationDate, setExpirationDate] = useState('')
  const [expirationTime, setExpirationTime] = useState('23:59')

  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Get current user data to check permissions
  const currentUserQuery = api.users.me.useQuery(undefined, {
    enabled: !!clerkUser,
  })

  const currentUserRole = currentUserQuery.data?.role
  const isSuperAdmin = currentUserRole === Role.SUPER_ADMIN

  // Role hierarchy for ban permissions
  const roleHierarchy = [
    Role.USER,
    Role.AUTHOR,
    Role.DEVELOPER,
    Role.MODERATOR,
    Role.ADMIN,
    Role.SUPER_ADMIN,
  ]

  // Check if current user can ban other users (must have manage_user_bans permission)
  const canBanUsers = currentUserQuery.data?.permissions?.includes(PERMISSIONS.MANAGE_USER_BANS)

  // Function to check if current user can ban a specific user
  const canBanUser = (userRole: string): boolean => {
    if (!currentUserRole) return false
    if (isSuperAdmin) return true // Super admin can ban anyone

    const currentRoleIndex = roleHierarchy.indexOf(currentUserRole)
    const targetRoleIndex = roleHierarchy.indexOf(userRole as Role)

    // Can only ban users with lower role hierarchy
    return targetRoleIndex < currentRoleIndex
  }

  // User search query - filters out users that current user cannot ban
  const userSearchQuery = api.users.searchUsers.useQuery(
    { query: userSearch },
    {
      enabled: userSearch.length >= 2 && !selectedUser && !props.userId,
    },
  )

  // Show dropdown when search results are available
  useEffect(() => {
    if (userSearchQuery.data && userSearch.length >= 2 && !selectedUser) {
      setShowUserDropdown(true)
    }
  }, [userSearchQuery.data, userSearch, selectedUser])

  const createBanMutation = api.userBans.create.useMutation({
    onSuccess: () => {
      toast.success('User banned successfully!')
      props.onSuccess()
      handleClose()
    },
    onError: (err) => {
      toast.error(`Failed to ban user: ${getErrorMessage(err)}`)
    },
  })

  const handleClose = () => {
    setSelectedUser(null)
    setUserSearch('')
    setShowUserDropdown(false)
    setReason('')
    setNotes('')
    setIsPermanent(true)
    setExpirationDate('')
    setExpirationTime('23:59')
    props.onClose()
  }

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user)
    setUserSearch(user.name || user.email)
    setShowUserDropdown(false)
  }

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()

    if (!selectedUser) {
      toast.error('Please select a user to ban')
      return
    }

    // Double-check permission to ban this user
    if (!canBanUser(selectedUser.role)) {
      toast.error(`You cannot ban users with ${selectedUser.role} role or higher`)
      return
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the ban')
      return
    }

    let expiresAt: Date | null = null
    if (!isPermanent) {
      if (!expirationDate) {
        toast.error('Please select an expiration date for temporary ban')
        return
      }

      const expirationDateTime = new Date(`${expirationDate}T${expirationTime}`)
      if (expirationDateTime <= new Date()) {
        toast.error('Expiration date must be in the future')
        return
      }

      expiresAt = expirationDateTime
    }

    createBanMutation.mutate({
      userId: selectedUser.id,
      reason: reason.trim(),
      notes: notes.trim() || undefined,
      expiresAt: expiresAt || undefined,
    } satisfies RouterInput['userBans']['create'])
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when modal opens
  useEffect(() => {
    if (props.isOpen && searchInputRef.current && !props.userId) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [props.isOpen, props.userId])

  const users = userSearchQuery.data ?? []
  const isLoading = userSearchQuery.isPending

  const minDate = new Date().toISOString().split('T')[0]

  // Show permission error if user doesn't have the right role
  if (props.isOpen && currentUserQuery.isSuccess && !canBanUsers) {
    return (
      <Modal isOpen={props.isOpen} onClose={props.onClose} title="Access Denied" size="sm">
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <ShieldOff className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Insufficient Permissions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            You must have at least MODERATOR role to ban users.
          </p>
          <Button variant="outline" onClick={props.onClose}>
            Close
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={props.isOpen} onClose={handleClose} title="Create User Ban" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Warning */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                Warning: User Ban Action
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Banning a user will prevent them from accessing the platform and hide their content
                from other users (shadow ban). This action should be used carefully and with proper
                justification.
              </p>
            </div>
          </div>
        </div>

        {/* User Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            User to Ban *
          </label>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={searchInputRef}
                type="text"
                value={userSearch}
                onChange={(ev) => {
                  setUserSearch(ev.target.value)
                  if (!selectedUser && ev.target.value.length >= 2) {
                    setShowUserDropdown(true)
                  } else if (ev.target.value.length < 2) {
                    setShowUserDropdown(false)
                  }
                  // Clear selection if user starts typing again
                  if (
                    selectedUser &&
                    ev.target.value !== (selectedUser.name || selectedUser.email)
                  ) {
                    setSelectedUser(null)
                  }
                }}
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            {/* User Dropdown */}
            {showUserDropdown && users.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {users.map((user) => {
                  const canBan = canBanUser(user.role)
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => canBan && handleUserSelect(user)}
                      disabled={!canBan}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        canBan
                          ? 'hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none cursor-pointer'
                          : 'opacity-50 cursor-not-allowed bg-gray-50/50 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div
                            className={`font-medium ${canBan ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                          >
                            {user.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {user.email}
                          </div>
                          {!canBan && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Cannot ban users with {user.role} role or higher
                            </div>
                          )}
                        </div>
                        <Badge>{user.role}</Badge>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Selected User Display */}
            {selectedUser && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedUser.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedUser.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{selectedUser.role}</Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(null)
                        setUserSearch('')
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </div>
                {/* Show warning for privileged users */}
                {selectedUser.role !== Role.USER && (
                  <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      <strong>Warning:</strong> This user has {selectedUser.role} privileges.
                      Banning them will remove their ability to perform administrative actions.
                    </p>
                  </div>
                )}
              </div>
            )}

            {showUserDropdown && userSearch.length >= 2 && users.length === 0 && !isLoading && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-4 text-center text-gray-500 dark:text-gray-400">
                No users found matching &quot;{userSearch}&quot;
              </div>
            )}
          </div>
          {userSearch.length > 0 && userSearch.length < 2 && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Type at least 2 characters to search for users
            </p>
          )}
        </div>

        {/* Ban Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reason for Ban *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a clear reason for banning this user..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            required
          />
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
            {reason.length}/500 characters
          </div>
        </div>

        {/* Ban Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Ban Duration
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="banType"
                checked={isPermanent}
                onChange={() => setIsPermanent(true)}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Permanent Ban</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="banType"
                checked={!isPermanent}
                onChange={() => setIsPermanent(false)}
                className="mr-2 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Temporary Ban</span>
            </label>
          </div>

          {!isPermanent && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={minDate}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required={!isPermanent}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expiration Time
                </label>
                <input
                  type="time"
                  value={expirationTime}
                  onChange={(e) => setExpirationTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional context or notes about this ban..."
            rows={3}
            maxLength={1000}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          />
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
            {notes.length}/1000 characters
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={createBanMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={!selectedUser || !reason.trim() || createBanMutation.isPending}
            isLoading={createBanMutation.isPending}
          >
            {isPermanent ? 'Ban User Permanently' : 'Ban User Temporarily'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateBanModal
