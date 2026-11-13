'use client'

import { useEffect, useRef, useState } from 'react'
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
  const createMutation = api.customFieldCategories.create.useMutation()
  const updateMutation = api.customFieldCategories.update.useMutation()
  const isPending = createMutation.isPending || updateMutation.isPending
  function closeModal() {
    if (!isPending) props.onClose()
  }
  return (
    <Modal
      isOpen={props.isOpen}
      onClose={closeModal}
      closeOnEscape={!isPending}
      closeOnBackdropClick={!isPending}
      hideCloseButton={isPending}
      title={props.categoryToEdit ? 'Edit Category' : 'Create Category'}
    >
      <CategoryForm
        key={`${props.isOpen}:${props.emulatorId}:${props.categoryToEdit?.id ?? 'new'}`}
        emulatorId={props.emulatorId}
        categoryToEdit={props.categoryToEdit}
        onClose={closeModal}
        onSuccess={props.onSuccess}
        createMutation={createMutation}
        updateMutation={updateMutation}
      />
    </Modal>
  )
}

type FormProps = Omit<Props, 'isOpen'> & {
  createMutation: ReturnType<typeof api.customFieldCategories.create.useMutation>
  updateMutation: ReturnType<typeof api.customFieldCategories.update.useMutation>
}

function CategoryForm(props: FormProps) {
  const { createMutation, updateMutation } = props
  const active = useRef(false)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  const [name, setName] = useState(props.categoryToEdit?.name || '')
  const [error, setError] = useState<string | null>(null)

  const utils = api.useUtils()

  async function handleSubmit() {
    if (createMutation.isPending || updateMutation.isPending) return
    if (!name.trim()) {
      setError('Category name is required')
      return
    }

    try {
      if (props.categoryToEdit) {
        await updateMutation.mutateAsync({
          id: props.categoryToEdit.id,
          name: name.trim(),
        })
      } else {
        await createMutation.mutateAsync({
          emulatorId: props.emulatorId,
          name: name.trim(),
        })
      }
      utils.customFieldCategories.getByEmulator
        .invalidate({ emulatorId: props.emulatorId })
        .catch(console.error)
      toast.success(
        props.categoryToEdit ? 'Category updated successfully!' : 'Category created successfully!',
      )
      props.onSuccess()
      if (active.current) props.onClose()
    } catch (error) {
      if (active.current) setError(getErrorMessage(error))
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="category-name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Category Name
        </label>
        <Input
          id="category-name"
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
  )
}
