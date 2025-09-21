'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, type FormEvent } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import {
  FormValidationSummary,
  renderCustomField,
  PerformanceSelector,
} from '@/app/listings/components/shared'
import { initializeCustomFieldValues } from '@/app/listings/components/shared/utils/form-helpers'
import { Button, Modal, LoadingSpinner, SelectInput } from '@/components/ui'
import { api } from '@/lib/api'
import { MarkdownEditor } from '@/lib/dynamic-imports'
import { UpdatePcListingUserSchema } from '@/schemas/pcListing'
import { PcOs } from '@orm'
import type { z } from 'zod'

type UpdatePcListingFormData = z.infer<typeof UpdatePcListingUserSchema>

interface Props {
  isOpen: boolean
  onClose: () => void
  pcListingId: string
  canEdit: boolean
  remainingMinutes?: number
  timeExpired?: boolean
  isPending?: boolean
  isApproved?: boolean
  onSuccess?: () => void
}

const osOptions = [
  { id: PcOs.WINDOWS, name: 'Windows' },
  { id: PcOs.LINUX, name: 'Linux' },
  { id: PcOs.MACOS, name: 'macOS' },
]

function EditPcListingModal(props: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pcListingQuery = api.pcListings.getForUserEdit.useQuery(
    { id: props.pcListingId },
    {
      enabled: props.isOpen && props.canEdit,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  )

  const performanceScalesQuery = api.listings.performanceScales.useQuery(undefined, {
    enabled: props.isOpen && props.canEdit,
  })

  const updateMutation = api.pcListings.update.useMutation({
    onSuccess: () => {
      toast.success('PC listing updated successfully!')
      setIsSubmitting(false)
      props.onClose()
      props.onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message)
      setIsSubmitting(false)
    },
  })

  const { control, handleSubmit, formState, reset } = useForm<UpdatePcListingFormData>({
    resolver: zodResolver(UpdatePcListingUserSchema),
    mode: 'onSubmit',
    criteriaMode: 'all',
  })

  // Reset form when modal opens or PC listing data changes
  useEffect(() => {
    if (pcListingQuery.data && props.isOpen) {
      const defaultCustomFieldValues = initializeCustomFieldValues(
        pcListingQuery.data.customFieldValues,
        pcListingQuery.data.emulator.customFieldDefinitions,
      )

      reset({
        id: pcListingQuery.data.id,
        performanceId: pcListingQuery.data.performanceId,
        memorySize: pcListingQuery.data.memorySize,
        os: pcListingQuery.data.os,
        osVersion: pcListingQuery.data.osVersion,
        notes: pcListingQuery.data.notes || '',
        customFieldValues: defaultCustomFieldValues,
      })
    }
  }, [pcListingQuery.data, props.isOpen, reset])

  const onSubmit = (data: UpdatePcListingFormData) => {
    setIsSubmitting(true)
    updateMutation.mutate(data)
  }

  const handleFormSubmit = (ev: FormEvent) => {
    ev.preventDefault()
    handleSubmit(onSubmit)()
  }

  if (!props.isOpen) return null

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Edit PC Listing"
      closeOnBackdropClick={false}
      closeOnEscape={false}
      size="lg"
    >
      <div className="space-y-4">
        {/* Status indicators */}
        <div className="flex items-center gap-2 mb-4">
          {props.canEdit && props.isPending && (
            <span className="text-sm text-orange-600 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded">
              Pending Approval
            </span>
          )}
          {props.canEdit && props.isApproved && (
            <span className="text-sm text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
              {props.remainingMinutes} minutes remaining
            </span>
          )}
        </div>

        {!props.canEdit ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Edit Time Expired
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                  You can only edit PC listings within 60 minutes of approval. Since this time has
                  passed, you&apos;ll need to create a new listing if you want to make changes.
                </p>
                <Link href="/pc-listings/new">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Create New PC Listing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {pcListingQuery.isPending && (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner text="Loading PC listing details..." />
              </div>
            )}

            {pcListingQuery.error && (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">
                  Failed to load PC listing details: {pcListingQuery.error.message}
                </p>
              </div>
            )}

            {pcListingQuery.data && (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Enhanced Editing:</strong> You can now edit performance rating, PC
                    specifications, custom fields, and notes.
                    {props.isPending && (
                      <span> You can edit anytime while your PC listing is pending approval.</span>
                    )}
                    {props.isApproved && (
                      <span>
                        {' '}
                        After approval, you have {props.remainingMinutes} minutes to make edits.
                      </span>
                    )}
                  </p>
                </div>

                {/* Game Info (read-only) */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PC Listing Details (Read-only)
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <strong>Game:</strong> {pcListingQuery.data.game.title}
                    </p>
                    <p>
                      <strong>System:</strong> {pcListingQuery.data.game.system?.name}
                    </p>
                    <p>
                      <strong>CPU:</strong> {pcListingQuery.data.cpu.brand.name}{' '}
                      {pcListingQuery.data.cpu.modelName}
                    </p>
                    <p>
                      <strong>GPU:</strong>{' '}
                      {pcListingQuery.data.gpu
                        ? `${pcListingQuery.data.gpu.brand.name} ${pcListingQuery.data.gpu.modelName}`
                        : 'Integrated Graphics'}
                    </p>
                    <p>
                      <strong>Emulator:</strong> {pcListingQuery.data.emulator.name}
                    </p>
                  </div>
                </div>

                {/* Performance Scale Selection */}
                <div>
                  <PerformanceSelector
                    control={control}
                    name="performanceId"
                    performanceScalesData={performanceScalesQuery.data}
                    errorMessage={formState.errors.performanceId?.message}
                  />
                </div>

                {/* Memory Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Memory Size (GB) *
                  </label>
                  <Controller
                    name="memorySize"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        min="1"
                        max="256"
                        {...field}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter memory size in GB"
                      />
                    )}
                  />
                  {formState.errors.memorySize && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {formState.errors.memorySize.message}
                    </p>
                  )}
                </div>

                {/* Operating System */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Operating System *
                  </label>
                  <Controller
                    name="os"
                    control={control}
                    render={({ field }) => (
                      <SelectInput
                        label="Operating System"
                        hideLabel
                        options={osOptions.map((os) => ({
                          id: os.id,
                          name: os.name,
                        }))}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value as PcOs)}
                      />
                    )}
                  />
                  {formState.errors.os && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {formState.errors.os.message}
                    </p>
                  )}
                </div>

                {/* OS Version */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    OS Version *
                  </label>
                  <Controller
                    name="osVersion"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="text"
                        {...field}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        placeholder="e.g., Windows 11 22H2, Ubuntu 22.04, macOS 13.0"
                      />
                    )}
                  />
                  {formState.errors.osVersion && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {formState.errors.osVersion.message}
                    </p>
                  )}
                </div>

                {/* Custom Fields */}
                {pcListingQuery.data.emulator.customFieldDefinitions &&
                  pcListingQuery.data.emulator.customFieldDefinitions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Emulator Settings
                      </h3>
                      <div className="space-y-4">
                        {pcListingQuery.data.emulator.customFieldDefinitions.map(
                          (fieldDef, index) =>
                            renderCustomField({
                              fieldDef,
                              index,
                              control,
                              formErrors: formState.errors,
                            }),
                        )}
                      </div>
                    </div>
                  )}

                {/* Notes */}
                <div>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <MarkdownEditor
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Enter your notes about this PC listing..."
                        rows={4}
                        label="Notes (Optional)"
                        maxLength={5000}
                        id="notes"
                        error={formState.errors.notes?.message}
                      />
                    )}
                  />
                </div>

                {/* Form Validation Summary */}
                <FormValidationSummary errors={formState.errors} />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={props.onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
                    Update PC Listing
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}

export default EditPcListingModal
