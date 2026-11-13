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
  brandName: string
  onSuccess: () => void
}

function BrandModal(props: Props) {
  const createBrand = api.deviceBrands.create.useMutation()
  const updateBrand = api.deviceBrands.update.useMutation()
  const isPending = createBrand.isPending || updateBrand.isPending
  function closeModal() {
    if (!isPending) props.onClose()
  }
  return (
    <Modal
      isOpen={props.isOpen}
      onClose={closeModal}
      hideCloseButton={isPending}
      title={props.editId ? 'Edit Brand' : 'Add Brand'}
      closeOnEscape={!isPending}
      closeOnBackdropClick={false}
      size="md"
    >
      <BrandForm
        key={`${props.isOpen}:${props.editId ?? 'new'}`}
        editId={props.editId}
        brandName={props.brandName}
        onClose={closeModal}
        onSuccess={props.onSuccess}
        createBrand={createBrand}
        updateBrand={updateBrand}
      />
    </Modal>
  )
}

type FormProps = Omit<Props, 'isOpen'> & {
  createBrand: ReturnType<typeof api.deviceBrands.create.useMutation>
  updateBrand: ReturnType<typeof api.deviceBrands.update.useMutation>
}

function BrandForm(props: FormProps) {
  const { createBrand, updateBrand } = props
  const active = useRef(false)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  const [name, setName] = useState(props.brandName)
  const [error, setError] = useState('')

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (createBrand.isPending || updateBrand.isPending) return
    setError('')
    try {
      if (props.editId) {
        await updateBrand.mutateAsync({
          id: props.editId,
          name,
        } satisfies RouterInput['deviceBrands']['update'])
      } else {
        await createBrand.mutateAsync({
          name,
        } satisfies RouterInput['deviceBrands']['create'])
      }

      toast.success(props.editId ? 'Brand updated!' : 'Brand created!')
      props.onSuccess()
      if (active.current) props.onClose()
    } catch (err) {
      if (active.current) setError(getErrorMessage(err, 'Failed to save brand.'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
          Brand Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full"
          placeholder="Enter brand name"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="ghost"
          onClick={props.onClose}
          disabled={createBrand.isPending || updateBrand.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={createBrand.isPending || updateBrand.isPending}
          disabled={createBrand.isPending || updateBrand.isPending}
        >
          {props.editId ? 'Save' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

export default BrandModal
