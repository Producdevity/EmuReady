'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { type z } from 'zod'
import {
  AdminAutocompleteField,
  AdminCustomFieldsSection,
  AdminEditActionBar,
  AdminListingEditShell,
  AdminNotesField,
  AdminPerformanceField,
  AdminPlatformField,
  AdminStatusField,
  diffCustomFieldValues,
  HANDHELD_LISTING_FIELD_LABELS,
  makeLoadDeviceItems,
  makeLoadEmulatorItems,
  makeLoadGameItems,
  useEmulatorCustomFields,
} from '@/app/admin/components/listing-edit'
import {
  FormValidationSummary,
  type DeviceOption,
  type EmulatorOption,
  type GameOption,
} from '@/app/listings/components/shared'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { UpdateListingAdminSchema } from '@/schemas/listing'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'

type ListingForEdit = NonNullable<RouterOutput['listings']['getForEdit']>
type UpdateListingFormData = z.infer<typeof UpdateListingAdminSchema>

interface Props {
  listing: ListingForEdit
}

function ListingEditForm(props: Props) {
  const router = useRouter()
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
    soc: props.listing.device.soc ?? null,
  })

  const [initialEmulator] = useState<EmulatorOption>({
    id: props.listing.emulator.id,
    name: props.listing.emulator.name,
    systems: props.listing.emulator.systems.map((s) => ({ id: s.id, name: s.name })),
  })

  const loadGameItems = useMemo(() => makeLoadGameItems(utils), [utils])
  const loadEmulatorItems = useMemo(() => makeLoadEmulatorItems(utils), [utils])
  const loadDeviceItems = useMemo(() => makeLoadDeviceItems(utils), [utils])

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
    },
  })

  const defaultCustomFieldValues = props.listing.customFieldValues.map((cfv) => ({
    customFieldDefinitionId: cfv.customFieldDefinition.id,
    value: cfv.value,
  }))

  const { register, handleSubmit, formState, setValue, watch, control, getValues } =
    useForm<UpdateListingFormData>({
      resolver: zodResolver(UpdateListingAdminSchema),
      defaultValues: {
        id: props.listing.id,
        gameId: props.listing.gameId,
        deviceId: props.listing.deviceId,
        emulatorId: props.listing.emulatorId,
        performanceId: props.listing.performanceId,
        platformId: props.listing.platformId ?? null,
        notes: props.listing.notes ?? '',
        status: props.listing.status,
        customFieldValues: defaultCustomFieldValues,
      },
    })

  const selectedEmulatorId = watch('emulatorId')
  const selectedDeviceId = watch('deviceId')

  const { query: customFieldsQuery, summary: customFieldDefinitionsForSummary } =
    useEmulatorCustomFields(selectedEmulatorId)

  useEffect(() => {
    if (!customFieldsQuery.data) return
    const raw = getValues('customFieldValues')
    const current = Array.isArray(raw) ? raw : []
    const nextValues = diffCustomFieldValues(customFieldsQuery.data, current)
    if (nextValues) setValue('customFieldValues', nextValues)
  }, [customFieldsQuery.data, getValues, setValue])

  const onSubmit = (data: UpdateListingFormData) => {
    updateListing.mutate({ ...data, id: props.listing.id })
  }

  return (
    <AdminListingEditShell
      id={props.listing.id}
      title="Listing Details"
      authorName={props.listing.author?.name}
      status={props.listing.status}
      createdAt={props.listing.createdAt}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...register('id')} />

        <AdminAutocompleteField
          control={control}
          name="gameId"
          errors={formState.errors}
          label="Game"
          placeholder="Search for games..."
          initial={initialGame}
          loadItems={loadGameItems}
          optionToLabel={(item) => item.title}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminAutocompleteField
            control={control}
            name="deviceId"
            errors={formState.errors}
            label="Device"
            placeholder="Search for devices..."
            initial={initialDevice}
            loadItems={loadDeviceItems}
            optionToLabel={(item) => `${item.brand.name} ${item.modelName}`}
          />
          <AdminAutocompleteField
            control={control}
            name="emulatorId"
            errors={formState.errors}
            label="Emulator"
            placeholder="Search for emulators..."
            initial={initialEmulator}
            loadItems={loadEmulatorItems}
            optionToLabel={(item) => item.name}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminPerformanceField control={control} name="performanceId" errors={formState.errors} />
          <AdminStatusField control={control} name="status" errors={formState.errors} />
        </div>

        <AdminPlatformField
          control={control}
          name="platformId"
          compatibility={{ kind: 'device', deviceId: selectedDeviceId }}
          label="Platform"
        />

        <AdminNotesField control={control} name="notes" errors={formState.errors} />

        <AdminCustomFieldsSection
          fieldDefinitions={customFieldsQuery.data ?? []}
          control={control}
          errors={formState.errors}
        />

        <FormValidationSummary
          errors={formState.errors}
          customFieldDefinitions={customFieldDefinitionsForSummary}
          fieldLabels={HANDHELD_LISTING_FIELD_LABELS}
        />

        <AdminEditActionBar
          onCancel={() => router.push('/admin/listings')}
          isSubmitting={updateListing.isPending}
          isDirty={formState.isDirty}
        />
      </form>
    </AdminListingEditShell>
  )
}

export default ListingEditForm
