'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button, Input, Modal } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'

interface Props {
  isOpen: boolean
  onClose: () => void
  editId: string | null
  systemName: string
  systemKey: string
  onSuccess: () => void
}

function SystemModal(props: Props) {
  const createSystem = api.systems.create.useMutation()
  const updateSystem = api.systems.update.useMutation()
  const isPending = createSystem.isPending || updateSystem.isPending
  function closeModal() {
    if (!isPending) props.onClose()
  }
  return (
    <Modal
      isOpen={props.isOpen}
      onClose={closeModal}
      hideCloseButton={isPending}
      title={props.editId ? 'Edit System' : 'Add System'}
      closeOnEscape={false}
      closeOnBackdropClick={false}
      size="md"
    >
      <SystemForm
        key={`${props.isOpen}:${props.editId ?? 'new'}`}
        editId={props.editId}
        systemName={props.systemName}
        systemKey={props.systemKey}
        onClose={closeModal}
        onSuccess={props.onSuccess}
        createSystem={createSystem}
        updateSystem={updateSystem}
      />
    </Modal>
  )
}

type FormProps = Omit<Props, 'isOpen'> & {
  createSystem: ReturnType<typeof api.systems.create.useMutation>
  updateSystem: ReturnType<typeof api.systems.update.useMutation>
}

function SystemForm(props: FormProps) {
  const { createSystem, updateSystem } = props
  const active = useRef(false)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  const [name, setName] = useState(props.systemName)
  const [key, setKey] = useState(props.systemKey)
  const [error, setError] = useState('')

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (createSystem.isPending || updateSystem.isPending) return
    setError('')
    try {
      if (props.editId) {
        await updateSystem.mutateAsync({
          id: props.editId,
          name,
          key: key || null,
        } satisfies RouterInput['systems']['update'])
      } else {
        await createSystem.mutateAsync({
          name,
          key: key || null,
        } satisfies RouterInput['systems']['create'])
      }
      toast.success(props.editId ? 'System updated!' : 'System created!')
      props.onSuccess()
      if (active.current) props.onClose()
    } catch (err) {
      if (active.current) setError(getErrorMessage(err, 'Failed to save system.'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
          System Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full"
          placeholder="Enter system name"
        />
      </div>

      <div>
        <label htmlFor="key" className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
          System Key (optional)
        </label>
        <Input
          id="key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full font-mono"
          placeholder="e.g., nintendo_switch, sony_playstation_5"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Used for API integrations (IGDB, TGDB, RAWG)
        </p>
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={props.onClose}
          disabled={createSystem.isPending || updateSystem.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={createSystem.isPending || updateSystem.isPending}
          disabled={createSystem.isPending || updateSystem.isPending}
        >
          {props.editId ? 'Save' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

export default SystemModal
