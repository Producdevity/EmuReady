'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { type z } from 'zod'
import {
  FormValidationSummary,
  renderCustomField,
  type GameOption,
  type EmulatorOption,
  type DeviceOption,
} from '@/app/listings/components/shared'
import {
  Button,
  ApprovalStatusBadge,
  SelectInput,
  Autocomplete,
  LocalizedDate,
} from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { UpdateListingAdminSchema } from '@/schemas/listing'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { ApprovalStatus } from '@orm'

type ListingForEdit = NonNullable<RouterOutput['listings']['getForEdit']>
type UpdateListingFormData = z.infer<typeof UpdateListingAdminSchema>

interface Props {
  listing: ListingForEdit
}

function ListingEditForm(props: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const utils = api.useUtils()

  const [initialGame] = useState<GameOption>({
    id: props.listing.game.id,
    title: props.listing.game.title,
    system: props.listing.game.system,
    status: props.listing.game.status,
  })

  const [initialDevice] = useState<DeviceOption>({
    id: props.listing.device.id,
    brand: props.listing.device.brand,
    modelName: props.listing.device.modelName,
    soc: props.listing.device.soc || {
      id: '',
      name: 'Unknown',
      manufacturer: 'Unknown',
    },
  })

  const [initialEmulator] = useState<EmulatorOption>({
    id: props.listing.emulator.id,
    name: props.listing.emulator.name,
    systems: [],
  })

  // Async loader functions using REAL API endpoints that exist
  const loadGameItems = useCallback(
    async (query: string): Promise<GameOption[]> => {
      try {
        // If query is empty, don't call the API since it requires min 1 character
        if (!query || query.trim().length === 0) {
          return []
        }
        const result = await utils.client.games.get.query({
          search: query,
          limit: 50,
        })
        return result.games.map((game) => ({
          id: game.id,
          title: game.title,
          system: game.system,
          status: game.status,
        }))
      } catch (error) {
        console.error('Error loading games:', error)
        return []
      }
    },
    [utils.client],
  )

  const loadEmulatorItems = useCallback(
    async (query: string): Promise<EmulatorOption[]> => {
      try {
        const result = await utils.client.emulators.get.query({
          search: query || undefined, // Pass undefined instead of empty string
          limit: 50,
        })
        return result.emulators.map((emulator) => ({
          id: emulator.id,
          name: emulator.name,
          systems: [], // Initialize with empty array since the API doesn't return systems data
        }))
      } catch (error) {
        console.error('Error loading emulators:', error)
        return []
      }
    },
    [utils.client],
  )

  const loadDeviceItems = useCallback(
    async (query: string): Promise<DeviceOption[]> => {
      try {
        const result = await utils.client.devices.get.query({
          search: query || undefined, // Pass undefined instead of empty string
          limit: 50,
        })
        return result.devices.map((device) => ({
          id: device.id,
          brand: device.brand,
          modelName: device.modelName,
          soc: device.soc
            ? {
                id: device.soc.id,
                name: device.soc.name,
                manufacturer: device.soc.manufacturer,
              }
            : {
                id: '',
                name: 'Unknown',
                manufacturer: 'Unknown',
              },
        }))
      } catch (error) {
        console.error('Error loading devices:', error)
        return []
      }
    },
    [utils.client],
  )

  const performanceScalesQuery = api.performanceScales.get.useQuery()

  const updateListing = api.listings.updateListingAdmin.useMutation({
    onSuccess: () => {
      toast.success('Listing updated successfully')
      utils.listings.getAllListings.invalidate().catch(console.error)
      utils.listings.getForEdit.invalidate({ id: props.listing.id }).catch(console.error)
      router.push('/admin/listings')
    },
    onError: (error) => {
      toast.error(`Failed to update listing: ${getErrorMessage(error)}`)
      console.error('Error updating listing:', error)
      setIsSubmitting(false)
    },
  })

  // Prepare default values
  const defaultCustomFieldValues = props.listing.customFieldValues.map((cfv) => ({
    customFieldDefinitionId: cfv.customFieldDefinition.id,
    value: cfv.value,
  }))

  const { register, handleSubmit, formState, setValue, watch, control, getValues } =
    useForm<UpdateListingFormData>({
      resolver: zodResolver(UpdateListingAdminSchema),
      defaultValues: {
        gameId: props.listing.gameId,
        deviceId: props.listing.deviceId,
        emulatorId: props.listing.emulatorId,
        performanceId: props.listing.performanceId,
        notes: props.listing.notes ?? '',
        status: props.listing.status,
        customFieldValues: defaultCustomFieldValues,
      },
    })

  // Watch for selected emulator to fetch its custom fields
  const selectedEmulatorId = watch('emulatorId')
  const customFieldsQuery = api.customFieldDefinitions.getByEmulator.useQuery(
    { emulatorId: selectedEmulatorId },
    { enabled: !!selectedEmulatorId, refetchOnWindowFocus: false, refetchOnReconnect: false },
  )

  useEffect(() => {
    if (!customFieldsQuery.data || customFieldsQuery.data.length === 0) return

    // Compare current custom field definition IDs with incoming
    const current = getValues('customFieldValues') ?? []
    const currentIds = current.map((v) => v.customFieldDefinitionId)
    const incomingIds = customFieldsQuery.data.map((f) => f.id)
    const sameIds =
      currentIds.length === incomingIds.length && currentIds.every((id, i) => id === incomingIds[i])
    if (sameIds) return

    // Preserve in-progress values when possible
    const newCustomFieldValues = customFieldsQuery.data.map((field) => {
      const existingValue = current.find((v) => v.customFieldDefinitionId === field.id)
      return {
        customFieldDefinitionId: field.id,
        value: existingValue?.value ?? null,
      }
    })

    setValue('customFieldValues', newCustomFieldValues)
  }, [customFieldsQuery.data, setValue, getValues])

  const onSubmit = (data: UpdateListingFormData) => {
    setIsSubmitting(true)
    updateListing.mutate({
      ...data,
      id: props.listing.id,
    })
  }

  const statusOptions = [
    { id: ApprovalStatus.PENDING, name: 'Pending' },
    { id: ApprovalStatus.APPROVED, name: 'Approved' },
    { id: ApprovalStatus.REJECTED, name: 'Rejected' },
  ]

  return (
    <div className="max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {/* Header Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Listing Details
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">ID: {props.listing.id}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Author: {props.listing.author?.name ?? 'Unknown'}
              </p>
            </div>
            <div className="text-right">
              <ApprovalStatusBadge status={props.listing.status} />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Created: <LocalizedDate date={props.listing.createdAt} format="date" />
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Game Selection */}
          <div>
            <Controller
              name="gameId"
              control={control}
              render={({ field }) => (
                <Autocomplete<GameOption>
                  label="Game"
                  value={field.value}
                  onChange={field.onChange}
                  items={[initialGame]}
                  loadItems={loadGameItems}
                  optionToValue={(item) => item.id}
                  optionToLabel={(item) => item.title}
                  placeholder="Search for games..."
                  minCharsToTrigger={1}
                />
              )}
            />
            {formState.errors.gameId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {formState.errors.gameId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Device Selection */}
            <div>
              <Controller
                name="deviceId"
                control={control}
                render={({ field }) => (
                  <Autocomplete<DeviceOption>
                    label="Device"
                    value={field.value}
                    onChange={field.onChange}
                    items={[initialDevice]}
                    loadItems={loadDeviceItems}
                    optionToValue={(item) => item.id}
                    optionToLabel={(item) => `${item.brand.name} ${item.modelName}`}
                    placeholder="Search for devices..."
                    minCharsToTrigger={1}
                  />
                )}
              />
              {formState.errors.deviceId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {formState.errors.deviceId.message}
                </p>
              )}
            </div>

            {/* Emulator Selection */}
            <div>
              <Controller
                name="emulatorId"
                control={control}
                render={({ field }) => (
                  <Autocomplete<EmulatorOption>
                    label="Emulator"
                    value={field.value}
                    onChange={field.onChange}
                    items={[initialEmulator]}
                    loadItems={loadEmulatorItems}
                    optionToValue={(item) => item.id}
                    optionToLabel={(item) => item.name}
                    placeholder="Search for emulators..."
                    minCharsToTrigger={1}
                  />
                )}
              />
              {formState.errors.emulatorId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {formState.errors.emulatorId.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Scale Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Performance Scale *
              </label>
              <Controller
                name="performanceId"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    label="Performance Scale"
                    hideLabel
                    options={
                      performanceScalesQuery.data?.map((scale) => ({
                        id: scale.id.toString(),
                        name: scale.label,
                      })) ?? []
                    }
                    value={field.value.toString()}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  />
                )}
              />
              {formState.errors.performanceId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {formState.errors.performanceId.message}
                </p>
              )}
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status *
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    label="Approval Status"
                    hideLabel
                    options={statusOptions}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value as ApprovalStatus)}
                  />
                )}
              />
              {formState.errors.status && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {formState.errors.status.message}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={4}
              placeholder="Additional notes about this listing..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            {formState.errors.notes && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {formState.errors.notes.message}
              </p>
            )}
          </div>

          {/* Custom Fields */}
          {customFieldsQuery.data && customFieldsQuery.data.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Custom Fields for Selected Emulator
              </h3>
              <div className="space-y-4">
                {customFieldsQuery.data.map((fieldDef, index) =>
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

          <FormValidationSummary errors={formState.errors} />

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/listings')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting || !formState.isDirty}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ListingEditForm
