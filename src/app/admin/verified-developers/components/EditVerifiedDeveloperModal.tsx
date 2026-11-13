'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button, Input, Modal, SelectInput } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'

type VerifiedDeveloperRecord =
  RouterOutput['verifiedDevelopers']['getVerifiedDevelopers']['verifiedDevelopers'][number]
type VerifiedDeveloper = Pick<VerifiedDeveloperRecord, 'id' | 'emulatorId' | 'notes'> & {
  user: Pick<VerifiedDeveloperRecord['user'], 'name' | 'email'>
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  verifiedDeveloper: VerifiedDeveloper | null
}

function EditVerifiedDeveloperModal(props: Props) {
  const mutation = api.verifiedDevelopers.updateVerifiedDeveloper.useMutation()
  function closeModal() {
    if (!mutation.isPending) props.onClose()
  }
  if (!props.verifiedDeveloper) return null
  return (
    <VerifiedDeveloperForm
      key={`${props.isOpen}:${props.verifiedDeveloper.id}`}
      {...props}
      verifiedDeveloper={props.verifiedDeveloper}
      mutation={mutation}
      onClose={closeModal}
    />
  )
}

type FormProps = Omit<Props, 'verifiedDeveloper'> & {
  verifiedDeveloper: VerifiedDeveloper
  mutation: ReturnType<typeof api.verifiedDevelopers.updateVerifiedDeveloper.useMutation>
}

function VerifiedDeveloperForm(props: FormProps) {
  const active = useRef(false)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  const [emulatorId, setEmulatorId] = useState(props.verifiedDeveloper.emulatorId)
  const [notes, setNotes] = useState(props.verifiedDeveloper.notes ?? '')
  const [error, setError] = useState('')

  const emulatorsQuery = api.emulators.get.useQuery({
    limit: 100,
    sortField: 'name',
    sortDirection: 'asc',
  })

  const updateVerifiedDeveloperMutation = props.mutation

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (updateVerifiedDeveloperMutation.isPending) return
    setError('')

    if (!emulatorId) {
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
      if (active.current) props.onClose()
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      if (active.current) setError(errorMessage)
      toast.error(`Failed to update verified developer: ${errorMessage}`)
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
      hideCloseButton={updateVerifiedDeveloperMutation.isPending}
      closeOnEscape={!updateVerifiedDeveloperMutation.isPending}
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
