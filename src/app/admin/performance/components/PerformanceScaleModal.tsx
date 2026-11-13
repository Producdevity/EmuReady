'use client'

import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from 'react'
import { Button, Input, Modal } from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
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
  const isPending = createPerformanceScale.isPending || updatePerformanceScale.isPending
  function closeModal() {
    if (!isPending) props.onClose()
  }
  return (
    <Modal
      isOpen={props.isOpen}
      onClose={closeModal}
      closeOnEscape={!isPending}
      hideCloseButton={isPending}
      title={props.editId ? 'Edit Performance Scale' : 'Add Performance Scale'}
      closeOnBackdropClick={false}
      size="md"
    >
      <PerformanceScaleForm
        key={`${props.isOpen}:${props.editId ?? 'new'}`}
        editId={props.editId}
        scale={props.scale}
        onClose={closeModal}
        onSuccess={props.onSuccess}
        createPerformanceScale={createPerformanceScale}
        updatePerformanceScale={updatePerformanceScale}
      />
    </Modal>
  )
}

type FormProps = Omit<Props, 'isOpen'> & {
  createPerformanceScale: ReturnType<typeof api.performanceScales.create.useMutation>
  updatePerformanceScale: ReturnType<typeof api.performanceScales.update.useMutation>
}

function PerformanceScaleForm(props: FormProps) {
  const { createPerformanceScale, updatePerformanceScale } = props
  const active = useRef(false)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  const [label, setLabel] = useState(props.scale?.label ?? '')
  const [description, setDescription] = useState(props.scale?.description ?? '')
  const [rank, setRank] = useState<number | string>(props.scale?.rank ?? '')
  const [error, setError] = useState('')

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (createPerformanceScale.isPending || updatePerformanceScale.isPending) return
    setError('')

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
      } else {
        await createPerformanceScale.mutateAsync({
          label,
          description: description.trim() || undefined,
          rank: rankNumber,
        } satisfies RouterInput['performanceScales']['create'])
      }

      toast.success(props.editId ? 'Performance scale updated!' : 'Performance scale created!')
      props.onSuccess()
      if (active.current) props.onClose()
    } catch (err) {
      if (active.current) setError(getErrorMessage(err, 'Failed to save performance scale.'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="label" className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
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
        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={props.onClose}
          disabled={createPerformanceScale.isPending || updatePerformanceScale.isPending}
        >
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
  )
}

export default PerformanceScaleModal
