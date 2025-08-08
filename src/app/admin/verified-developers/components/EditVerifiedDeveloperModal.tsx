'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { Button, Input, Modal, SelectInput } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'

interface VerifiedDeveloper {
  id: string
  emulatorId: string
  notes: string | null
  user: {
    id: string
    name: string | null
    email: string
    profileImage: string | null
  }
  emulator: {
    id: string
    name: string
    logo: string | null
  }
  verifier: {
    id: string
    name: string | null
    email: string
  }
  verifiedAt: Date
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  verifiedDeveloper: VerifiedDeveloper | null
}

function EditVerifiedDeveloperModal(props: Props) {
  const [emulatorId, setEmulatorId] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const emulatorsQuery = api.emulators.get.useQuery({
    limit: 100,
    sortField: 'name',
    sortDirection: 'asc',
  })

  const updateVerifiedDeveloperMutation =
    api.verifiedDevelopers.updateVerifiedDeveloper.useMutation()

  // Reset form when modal opens or verified developer changes
  useEffect(() => {
    if (props.isOpen && props.verifiedDeveloper) {
      setEmulatorId(props.verifiedDeveloper.emulatorId)
      setNotes(props.verifiedDeveloper.notes || '')
      setError('')
    }
  }, [props.isOpen, props.verifiedDeveloper])

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')

    if (!props.verifiedDeveloper || !emulatorId) {
      setError('Please select an emulator')
      return
    }

    try {
      await updateVerifiedDeveloperMutation.mutateAsync({
        id: props.verifiedDeveloper.id,
        emulatorId,
        notes: notes || undefined,
      })

      toast.success('Verified developer updated successfully!')
      props.onSuccess()
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      toast.error(`Failed to update verified developer: ${errorMessage}`)
    }
  }

  if (!props.verifiedDeveloper) {
    return null
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
      title="Edit Verified Developer"
      size="md"
      closeOnBackdropClick={false}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            Developer
          </label>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {props.verifiedDeveloper.user.name || props.verifiedDeveloper.user.email}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {props.verifiedDeveloper.user.email}
            </div>
          </div>
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
            disabled={updateVerifiedDeveloperMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={updateVerifiedDeveloperMutation.isPending}
            disabled={updateVerifiedDeveloperMutation.isPending}
          >
            Update
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default EditVerifiedDeveloperModal
