'use client'

import { useState, type FormEvent } from 'react'
import { Button, Input } from '@/components/ui'
import { api } from '@/lib/api'

interface Props {
  editId: string | null
  emulatorName: string
  onClose: () => void
  onSuccess: () => void
}

function EmulatorModal(props: Props) {
  const createEmulator = api.emulators.create.useMutation()
  const updateEmulator = api.emulators.update.useMutation()
  const [name, setName] = useState(props.emulatorName)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')
    setSuccess('')
    try {
      if (props.editId) {
        await updateEmulator.mutateAsync({ id: props.editId, name })
        setSuccess('Emulator updated!')
      } else {
        await createEmulator.mutateAsync({ name })
        setSuccess('Emulator created!')
      }
      setName('')

      props.onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save emulator.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-all">
      <form
        className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 relative"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-extrabold mb-6 text-gray-900 dark:text-white tracking-tight">
          {props.editId ? 'Edit Emulator' : 'Add Emulator'}
        </h2>
        <label className="block mb-2 font-medium">Name</label>
        <Input
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          required
          className="mb-4 w-full"
        />
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
        <div className="flex gap-2 justify-end mt-6">
          <Button type="button" variant="secondary" onClick={props.onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={createEmulator.isPending || updateEmulator.isPending}
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            {props.editId ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default EmulatorModal
