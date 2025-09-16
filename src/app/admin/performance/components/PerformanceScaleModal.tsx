'use client'

import { useState, type FormEvent, type ChangeEvent, useEffect } from 'react'
import { Button, Input, Modal } from '@/components/ui'
import { api } from '@/lib/api'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { type PerformanceScale } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  editId: number | null
  scale?: PerformanceScale
  onSuccess: () => void
}

function PerformanceScaleModal(props: Props) {
  const createPerformanceScale = api.performanceScales.create.useMutation()
  const updatePerformanceScale = api.performanceScales.update.useMutation()
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [rank, setRank] = useState<number | string>('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Update form fields when props change or modal opens
  useEffect(() => {
    if (props.isOpen) {
      setLabel(props.scale?.label || '')
      setDescription(props.scale?.description || '')
      setRank(props.scale?.rank || '')
      setError('')
      setSuccess('')
    }
  }, [props.isOpen, props.scale])

  // Reset form when modal closes
  useEffect(() => {
    if (!props.isOpen) {
      setLabel('')
      setDescription('')
      setRank('')
      setError('')
      setSuccess('')
    }
  }, [props.isOpen])

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    setError('')
    setSuccess('')

    const rankNumber = Number(rank)
    if (isNaN(rankNumber) || rankNumber < 1) {
      setError('Rank must be a valid number greater than 0')
      return
    }

    try {
      if (props.editId) {
        await updatePerformanceScale.mutateAsync({
          id: props.editId,
          label,
          description: description.trim() || undefined,
          rank: rankNumber,
        } satisfies RouterInput['performanceScales']['update'])
        setSuccess('Performance scale updated!')
      } else {
        await createPerformanceScale.mutateAsync({
          label,
          description: description.trim() || undefined,
          rank: rankNumber,
        } satisfies RouterInput['performanceScales']['create'])
        setSuccess('Performance scale created!')
      }

      props.onSuccess()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save performance scale.'))
    }
  }

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.editId ? 'Edit Performance Scale' : 'Add Performance Scale'}
      closeOnBackdropClick={false}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="label"
            className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
          >
            Performance Level
          </label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            className="w-full"
            placeholder="e.g., Perfect, Playable, Slow, Unplayable"
          />
        </div>

        <div>
          <label htmlFor="rank" className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            Rank
          </label>
          <Input
            id="rank"
            type="number"
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            required
            min="1"
            className="w-full"
            placeholder="Higher numbers = better performance"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Higher rank numbers indicate better performance (e.g., Perfect = 5, Unplayable = 1)
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
          >
            Description
          </label>
          <Input
            as="textarea"
            id="description"
            value={description}
            onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
            className="w-full"
            rows={3}
            placeholder="Describe what this performance level means (optional)"
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
          <Button type="button" variant="outline" onClick={props.onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={createPerformanceScale.isPending || updatePerformanceScale.isPending}
            disabled={createPerformanceScale.isPending || updatePerformanceScale.isPending}
          >
            {props.editId ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default PerformanceScaleModal
