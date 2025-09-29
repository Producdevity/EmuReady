'use client'

import { Search, ShieldPlus } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button, Input, Modal, Dropdown } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import { EntitlementSource } from '@orm'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type UserOption = RouterOutput['users']['searchUsers'][number]

export default function GrantEntitlementModal(props: Props) {
  const utils = api.useUtils()
  const [query, setQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [source, setSource] = useState<EntitlementSource>(EntitlementSource.MANUAL)
  const [referenceId, setReferenceId] = useState('')
  const [notes, setNotes] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)

  const searchQuery = api.users.searchUsers.useQuery(
    { query },
    { enabled: query.length >= 2 && !selectedUser },
  )

  useEffect(() => {
    if (searchQuery.data && query.length >= 2 && !selectedUser) setShowDropdown(true)
  }, [searchQuery.data, query, selectedUser])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!dropdownRef.current || dropdownRef.current.contains(event.target as Node)) return
      setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const grantMutation = api.adminEntitlements.grant.useMutation({
    onSuccess: async () => {
      toast.success('Entitlement granted')
      await utils.adminEntitlements.list.invalidate()
      props.onSuccess()
      handleClose()
    },
    onError: () => toast.error('Failed to grant entitlement'),
  })

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!selectedUser) return toast.error('Select a user')
    await grantMutation.mutateAsync({
      userId: selectedUser.id,
      source,
      referenceId: referenceId || undefined,
      notes: notes || undefined,
    })
  }

  const handleClose = () => {
    setQuery('')
    setSelectedUser(null)
    setShowDropdown(false)
    setSource('MANUAL')
    setReferenceId('')
    setNotes('')
    props.onClose()
  }

  return (
    <Modal isOpen={props.isOpen} onClose={handleClose} title="Grant Entitlement" size="lg">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">User</label>
          <div className="relative" ref={dropdownRef}>
            <Input
              value={selectedUser ? selectedUser.name || selectedUser.email : query}
              onChange={(e) => {
                setSelectedUser(null)
                setQuery((e.target as HTMLInputElement).value)
              }}
              placeholder="Search users by name or email…"
              leftIcon={<Search className="w-4 h-4" />}
            />
            {showDropdown && (
              <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 shadow-xl">
                {searchQuery.isPending ? (
                  <div className="p-3 text-sm text-gray-500">Searching…</div>
                ) : searchQuery.data && searchQuery.data.length > 0 ? (
                  searchQuery.data.map((u) => (
                    <div
                      key={u.id}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => {
                        setSelectedUser(u)
                        setShowDropdown(false)
                      }}
                    >
                      <div className="font-medium">{u.name || u.email}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500">No users found</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Source</label>
            <Dropdown
              options={[
                { value: EntitlementSource.PLAY, label: 'PLAY' },
                { value: EntitlementSource.PATREON, label: 'PATREON' },
                { value: EntitlementSource.MANUAL, label: 'MANUAL' },
              ]}
              value={source}
              onChange={(v) => setSource(v as EntitlementSource)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Reference (optional)
            </label>
            <Input
              value={referenceId}
              onChange={(e) => setReferenceId((e.target as HTMLInputElement).value)}
              placeholder="GPA.* or transaction id"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes (optional)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes"
            className="w-full rounded-xl border border-gray-200 bg-white/80 py-2 px-3 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800/80 dark:text-white"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button type="submit" isLoading={grantMutation.isPending} icon={ShieldPlus}>
            Grant
          </Button>
        </div>
      </form>
    </Modal>
  )
}
