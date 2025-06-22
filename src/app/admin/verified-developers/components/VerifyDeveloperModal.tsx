'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { Button, Input, Modal } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function VerifyDeveloperModal(props: Props) {
  const [userId, setUserId] = useState('')
  const [emulatorId, setEmulatorId] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const usersQuery = api.users.getAll.useQuery({
    limit: 100,
    sortField: 'name',
    sortDirection: 'asc',
  })

  const emulatorsQuery = api.emulators.get.useQuery({
    limit: 100,
    sortField: 'name',
    sortDirection: 'asc',
  })

  const verifyDeveloperMutation =
    api.verifiedDevelopers.verifyDeveloper.useMutation()

  // Reset form when modal opens
  useEffect(() => {
    if (props.isOpen) {
      setUserId('')
      setEmulatorId('')
      setNotes('')
      setError('')
    }
  }, [props.isOpen])

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
          <label
            htmlFor="userId"
            className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
          >
            User
          </label>
          <select
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            required
          >
            <option value="">Select a user</option>
            {usersQuery.data?.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="emulatorId"
            className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
          >
            Emulator
          </label>
          <select
            id="emulatorId"
            value={emulatorId}
            onChange={(e) => setEmulatorId(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            required
          >
            <option value="">Select an emulator</option>
            {emulatorsQuery.data?.emulators.map((emulator) => (
              <option key={emulator.id} value={emulator.id}>
                {emulator.name}
              </option>
            ))}
          </select>
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
