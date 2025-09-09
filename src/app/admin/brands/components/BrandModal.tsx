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
  brandName: string
  onSuccess: () => void
}

function BrandModal(props: Props) {
  const createBrand = api.deviceBrands.create.useMutation()
  const updateBrand = api.deviceBrands.update.useMutation()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Update form fields when props change or modal opens
  useEffect(() => {
    if (props.isOpen) {
      setName(props.brandName || '')
      setError('')
      setSuccess('')
    }
  }, [props.isOpen, props.brandName])

  // Reset form when modal closes
  useEffect(() => {
    if (!props.isOpen) {
      setName('')
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
        await updateBrand.mutateAsync({
          id: props.editId,
          name,
        } satisfies RouterInput['deviceBrands']['update'])
        setSuccess('Brand updated!')
      } else {
        await createBrand.mutateAsync({
          name,
        } satisfies RouterInput['deviceBrands']['create'])
        setSuccess('Brand created!')
      }

      props.onSuccess()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save brand.'))
    }
  }

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.editId ? 'Edit Brand' : 'Add Brand'}
      closeOnBackdropClick={false}
      size="md"
    >
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
          <Button type="button" variant="ghost" onClick={props.onClose}>
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
    </Modal>
  )
}

export default BrandModal
