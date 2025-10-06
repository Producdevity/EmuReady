'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Modal } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import { type CustomFieldCategory } from '@orm'

interface Props {
  emulatorId: string
  categoryToEdit?: CustomFieldCategory | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CategoryFormModal(props: Props) {
  const [name, setName] = useState(props.categoryToEdit?.name || '')
  const [error, setError] = useState<string | null>(null)

  const utils = api.useUtils()

  const createMutation = api.customFieldCategories.create.useMutation({
    onSuccess: () => {
      utils.customFieldCategories.getByEmulator
        .invalidate({ emulatorId: props.emulatorId })
        .catch(console.error)
      toast.success('Category created successfully!')
      props.onSuccess()
      props.onClose()
    },
    onError: (err) => {
      setError(getErrorMessage(err))
    },
  })

  const updateMutation = api.customFieldCategories.update.useMutation({
    onSuccess: () => {
      utils.customFieldCategories.getByEmulator
        .invalidate({ emulatorId: props.emulatorId })
        .catch(console.error)
      toast.success('Category updated successfully!')
      props.onSuccess()
      props.onClose()
    },
    onError: (err) => {
      setError(getErrorMessage(err))
    },
  })

  useEffect(() => {
    setName(props.categoryToEdit?.name || '')
    setError(null)
  }, [props.categoryToEdit, props.isOpen])

  function handleSubmit() {
    if (!name.trim()) {
      setError('Category name is required')
      return
    }

    if (props.categoryToEdit) {
      updateMutation.mutate({
        id: props.categoryToEdit.id,
        name: name.trim(),
      })
    } else {
      createMutation.mutate({
        emulatorId: props.emulatorId,
        name: name.trim(),
      })
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.categoryToEdit ? 'Edit Category' : 'Create Category'}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Graphics, Audio, Performance"
            className={error ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={props.onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} isLoading={isLoading}>
            {props.categoryToEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
