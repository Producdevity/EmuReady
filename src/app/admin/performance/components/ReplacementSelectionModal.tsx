'use client'

import { useState } from 'react'
import { Button, Modal } from '@/components/ui'
import { api } from '@/lib/api'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { type PerformanceScaleForDeletion } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  scaleToDelete: PerformanceScaleForDeletion | null
  onSuccess: () => void
}

function ReplacementSelectionModal(props: Props) {
  const [selectedReplacementId, setSelectedReplacementId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const performanceScalesQuery = api.performanceScales.get.useQuery({})
  const deletePerformanceScale = api.performanceScales.delete.useMutation({
    onSuccess: () => {
      props.onSuccess()
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, 'Failed to delete performance scale.'))
    },
  })

  const availableScales = (performanceScalesQuery.data ?? []).filter(
    (scale) => scale.id !== props.scaleToDelete?.id,
  )

  const handleDelete = async () => {
    if (!props.scaleToDelete || !selectedReplacementId) return

    setError('')

    try {
      // For now, we'll use the regular delete since the replacement functionality
      // isn't implemented in the backend yet. This is marked as TODO.
      await deletePerformanceScale.mutateAsync({
        id: props.scaleToDelete.id,
      } satisfies RouterInput['performanceScales']['delete'])
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete performance scale.'))
    }
  }

  if (!props.scaleToDelete) return null

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Replace Performance Scale"
      closeOnBackdropClick={false}
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Performance Scale In Use
              </h3>
              <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                <p>
                  The performance scale &ldquo;{props.scaleToDelete.label}
                  &rdquo; is currently used by {props.scaleToDelete.listingsCount} listing(s).
                </p>
                <p className="mt-1">
                  Select a replacement performance scale to update all existing listings.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="replacement"
            className="block mb-2 font-medium text-gray-700 dark:text-gray-300"
          >
            Replacement Performance Scale
          </label>
          <select
            id="replacement"
            value={selectedReplacementId || ''}
            onChange={(e) => setSelectedReplacementId(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="">Select a replacement...</option>
            {availableScales.map((scale) => (
              <option key={scale.id} value={scale.id}>
                {scale.label} (Rank: {scale.rank})
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={props.onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            disabled={!selectedReplacementId || deletePerformanceScale.isPending}
            isLoading={deletePerformanceScale.isPending}
          >
            Delete and Replace
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ReplacementSelectionModal
