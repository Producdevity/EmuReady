'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { Button, Input, Modal, SelectInput } from '@/components/ui'
import { Autocomplete } from '@/components/ui/form'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import { Role } from '@orm'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface UserOption {
  id: string
  name: string | null
  email: string
  profileImage: string | null
  role: Role
  [key: string]: unknown // Add index signature for AutocompleteOptionBase
}

function VerifyDeveloperModal(props: Props) {
  const [userId, setUserId] = useState<string | null>(null)
  const [emulatorId, setEmulatorId] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const utils = api.useUtils()

  const emulatorsQuery = api.emulators.get.useQuery({
    limit: 100,
    sortField: 'name',
    sortDirection: 'asc',
  })

  const verifyDeveloperMutation = api.verifiedDevelopers.verifyDeveloper.useMutation()

  // Reset form when modal opens
  useEffect(() => {
    if (props.isOpen) {
      setUserId(null)
      setEmulatorId('')
      setNotes('')
      setError('')
    }
  }, [props.isOpen])

  const loadUsers = async (query: string): Promise<UserOption[]> => {
    const result = await utils.users.searchUsers.fetch({
      query: query,
      limit: 20,
      minRole: Role.DEVELOPER, // Only load users with DEVELOPER role or higher
    })
    return result
  }

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')

    if (!userId || !emulatorId) {
      setError('Please select both a user and an emulator')
      return
    }

    try {
      await verifyDeveloperMutation.mutateAsync({
        userId,
        emulatorId,
        notes: notes || undefined,
      })

      toast.success('Developer verified successfully!')
      props.onSuccess()
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      toast.error(`Failed to verify developer: ${errorMessage}`)
    }
  }

  const emulatorOptions = [
    { id: '', name: 'Select an emulator' },
    ...(emulatorsQuery.data?.emulators.map((emulator) => ({
      id: emulator.id,
      name: emulator.name,
    })) ?? []),
  ]

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Verify Developer"
      size="md"
      closeOnBackdropClick={false}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Autocomplete<UserOption>
            label="User"
            value={userId}
            onChange={setUserId}
            loadItems={loadUsers}
            optionToValue={(user) => user.id}
            optionToLabel={(user) => user.name || user.email}
            customOptionRenderer={(user) => (
              <div className="flex items-center justify-between w-full">
                <div>
                  <div className="font-medium">{user.name || user.email}</div>
                  {user.name && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                  )}
                </div>
                <div className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {user.role}
                </div>
              </div>
            )}
            placeholder="Search for a user with DEVELOPER role or higher..."
            minCharsToTrigger={2}
            debounceTime={300}
          />
        </div>

        <div>
          <SelectInput
            label="Emulator"
            value={emulatorId}
            onChange={(ev) => setEmulatorId(ev.target.value)}
            options={emulatorOptions}
          />
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
          >
            Notes (Optional)
          </label>
          <Input
            id="notes"
            as="textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about this verification..."
            rows={3}
            className="w-full"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={props.onClose}
            disabled={verifyDeveloperMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={verifyDeveloperMutation.isPending}
            disabled={verifyDeveloperMutation.isPending}
          >
            Verify Developer
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default VerifyDeveloperModal
