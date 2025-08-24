'use client'

import { useState, type FormEvent, useEffect } from 'react'
import { Button, Input, Modal } from '@/components/ui'
import { api } from '@/lib/api'
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
  const [name, setName] = useState(props.systemName)
  const [key, setKey] = useState(props.systemKey)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (props.isOpen) {
      setName(props.systemName || '')
      setKey(props.systemKey || '')
      setError('')
      setSuccess('')
    }
  }, [props.isOpen, props.systemName, props.systemKey])

  useEffect(() => {
    if (!props.isOpen) {
      setName('')
      setKey('')
      setError('')
      setSuccess('')
    }
  }, [props.isOpen])

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')
    setSuccess('')
    try {
      if (props.editId) {
        await updateSystem.mutateAsync({
          id: props.editId,
          name,
          key: key || null,
        } satisfies RouterInput['systems']['update'])
        setSuccess('System updated!')
      } else {
        await createSystem.mutateAsync({
          name,
          key: key || null,
        } satisfies RouterInput['systems']['create'])
        setSuccess('System created!')
      }
      setName('')
      setKey('')
      props.onSuccess()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save system.'))
    }
  }

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.editId ? 'Edit System' : 'Add System'}
      closeOnEscape={false}
      closeOnBackdropClick={false}
      size="md"
    >
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
          <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded">
            {success}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={props.onClose}>
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
    </Modal>
  )
}

export default SystemModal
