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
} from '@/app/listings/components/shared'
import { Button, Modal, SelectInput, LoadingSpinner } from '@/components/ui'
import { MarkdownEditor } from '@/components/ui/form'
import { api } from '@/lib/api'
import { UpdateListingUserSchema } from '@/schemas/listing'
import type { z } from 'zod'

type UpdateListingFormData = z.infer<typeof UpdateListingUserSchema>

interface Props {
  isOpen: boolean
  onClose: () => void
  listingId: string
  canEdit: boolean
  remainingMinutes?: number
  timeExpired?: boolean
  isPending?: boolean
  isApproved?: boolean
  onSuccess?: () => void
}

function EditListingModal(props: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const listingQuery = api.listings.getForUserEdit.useQuery(
    { id: props.listingId },
    { enabled: props.isOpen && props.canEdit },
  )

  const performanceScalesQuery = api.performanceScales.get.useQuery(undefined, {
    enabled: props.isOpen && props.canEdit,
  })

  const updateMutation = api.listings.update.useMutation({
    onSuccess: () => {
      toast.success('Listing updated successfully!')
      setIsSubmitting(false)
      props.onClose()
      props.onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message)
      setIsSubmitting(false)
    },
  })

  const { control, handleSubmit, formState, reset } =
    useForm<UpdateListingFormData>({
      resolver: zodResolver(UpdateListingUserSchema),
    })

  // Reset form when modal opens or listing data changes
  useEffect(() => {
    if (listingQuery.data && props.isOpen) {
      const defaultCustomFieldValues = listingQuery.data.customFieldValues.map(
        (cfv) => ({
          customFieldDefinitionId: cfv.customFieldDefinition.id,
          value: cfv.value,
        }),
      )

      reset({
        id: listingQuery.data.id,
        performanceId: listingQuery.data.performanceId,
        notes: listingQuery.data.notes || '',
        customFieldValues: defaultCustomFieldValues,
      })
    }
  }, [listingQuery.data, props.isOpen, reset])

  const onSubmit = (data: UpdateListingFormData) => {
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
      title="Edit Listing"
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
                  You can only edit listings within 60 minutes of approval.
                  Since this time has passed, you&apos;ll need to create a new
                  listing if you want to make changes.
                </p>
                <Link href="/listings/new">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Create New Listing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {listingQuery.isPending && (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner text="Loading listing details..." />
              </div>
            )}

            {listingQuery.error && (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">
                  Failed to load listing details: {listingQuery.error.message}
                </p>
              </div>
            )}

            {listingQuery.data && (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Enhanced Editing:</strong> You can now edit
                    performance rating, custom fields, and notes.
                    {props.isPending && (
                      <span>
                        {' '}
                        You can edit anytime while your listing is pending
                        approval.
                      </span>
                    )}
                    {props.isApproved && (
                      <span>
                        {' '}
                        After approval, you have {props.remainingMinutes}{' '}
                        minutes to make edits.
                      </span>
                    )}
                  </p>
                </div>

                {/* Game Info (read-only) */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Listing Details (Read-only)
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <strong>Game:</strong> {listingQuery.data.game.title}
                    </p>
                    <p>
                      <strong>System:</strong>{' '}
                      {listingQuery.data.game.system.name}
                    </p>
                    <p>
                      <strong>Device:</strong>{' '}
                      {listingQuery.data.device.brand.name}{' '}
                      {listingQuery.data.device.modelName}
                    </p>
                    <p>
                      <strong>Emulator:</strong>{' '}
                      {listingQuery.data.emulator.name}
                    </p>
                  </div>
                </div>

                {/* Performance Scale Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Performance Rating *
                  </label>
                  <Controller
                    name="performanceId"
                    control={control}
                    render={({ field }) => (
                      <SelectInput
                        label="Performance Rating"
                        hideLabel
                        options={
                          performanceScalesQuery.data?.map((scale) => ({
                            id: scale.id.toString(),
                            name: scale.label,
                          })) ?? []
                        }
                        value={field.value?.toString() ?? ''}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10))
                        }
                      />
                    )}
                  />
                  {formState.errors.performanceId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {formState.errors.performanceId.message}
                    </p>
                  )}
                </div>

                {/* Custom Fields */}
                {listingQuery.data.emulator.customFieldDefinitions &&
                  listingQuery.data.emulator.customFieldDefinitions.length >
                    0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Emulator Settings
                      </h3>
                      <div className="space-y-4">
                        {listingQuery.data.emulator.customFieldDefinitions.map(
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
                        placeholder="Enter your notes about this listing..."
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
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Update Listing
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

export default EditListingModal
