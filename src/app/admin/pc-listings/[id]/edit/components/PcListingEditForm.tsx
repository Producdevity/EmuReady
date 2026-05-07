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
  AdminMemorySizeField,
  AdminNotesField,
  AdminOsField,
  AdminOsVersionField,
  AdminPerformanceField,
  AdminPlatformField,
  AdminStatusField,
  PC_LISTING_FIELD_LABELS,
  diffCustomFieldValues,
  makeLoadCpuItems,
  makeLoadEmulatorItems,
  makeLoadGameItems,
  makeLoadGpuItems,
  useEmulatorCustomFields,
  type CpuOption,
  type GpuOption,
} from '@/app/admin/components/listing-edit'
import {
  FormValidationSummary,
  type EmulatorOption,
  type GameOption,
} from '@/app/listings/components/shared'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { UpdatePcListingAdminSchema } from '@/schemas/pcListing'
import { type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'

type PcListingForEdit = NonNullable<RouterOutput['pcListings']['getForEdit']>
type UpdatePcListingFormData = z.infer<typeof UpdatePcListingAdminSchema>

interface Props {
  pcListing: PcListingForEdit
}

function PcListingEditForm(props: Props) {
  const router = useRouter()
  const utils = api.useUtils()

  const [initialGame] = useState<GameOption>({
    id: props.pcListing.game.id,
    title: props.pcListing.game.title,
    system: props.pcListing.game.system,
    status: props.pcListing.game.status,
  })

  const [initialCpu] = useState<CpuOption>({
    id: props.pcListing.cpu.id,
    modelName: props.pcListing.cpu.modelName,
    brand: { id: props.pcListing.cpu.brand.id, name: props.pcListing.cpu.brand.name },
  })

  const [initialGpu] = useState<GpuOption | null>(
    props.pcListing.gpu
      ? {
          id: props.pcListing.gpu.id,
          modelName: props.pcListing.gpu.modelName,
          brand: { id: props.pcListing.gpu.brand.id, name: props.pcListing.gpu.brand.name },
        }
      : null,
  )

  const [initialEmulator] = useState<EmulatorOption>({
    id: props.pcListing.emulator.id,
    name: props.pcListing.emulator.name,
    systems: props.pcListing.emulator.systems.map((s) => ({ id: s.id, name: s.name })),
  })

  const loadGameItems = useMemo(() => makeLoadGameItems(utils), [utils])
  const loadEmulatorItems = useMemo(() => makeLoadEmulatorItems(utils), [utils])
  const loadCpuItems = useMemo(() => makeLoadCpuItems(utils), [utils])
  const loadGpuItems = useMemo(() => makeLoadGpuItems(utils), [utils])

  const updateMutation = api.pcListings.updateAdmin.useMutation({
    onSuccess: () => {
      toast.success('PC listing updated successfully')
      utils.pcListings.getForEdit.invalidate({ id: props.pcListing.id }).catch(console.error)
      utils.pcListings.get.invalidate().catch(console.error)
      router.push('/admin/pc-listing-approvals')
    },
    onError: (error) => {
      toast.error(`Failed to update PC listing: ${getErrorMessage(error)}`)
      console.error('Error updating PC listing:', error)
    },
  })

  const defaultCustomFieldValues = props.pcListing.customFieldValues.map((cfv) => ({
    customFieldDefinitionId: cfv.customFieldDefinition.id,
    value: cfv.value,
  }))

  const { register, handleSubmit, formState, setValue, watch, control, getValues } =
    useForm<UpdatePcListingFormData>({
      resolver: zodResolver(UpdatePcListingAdminSchema),
      defaultValues: {
        id: props.pcListing.id,
        gameId: props.pcListing.gameId,
        cpuId: props.pcListing.cpuId,
        gpuId: props.pcListing.gpuId ?? undefined,
        emulatorId: props.pcListing.emulatorId,
        performanceId: props.pcListing.performanceId,
        memorySize: props.pcListing.memorySize,
        os: props.pcListing.os ?? null,
        osVersion: props.pcListing.osVersion ?? '',
        platformId: props.pcListing.platformId ?? null,
        notes: props.pcListing.notes ?? '',
        status: props.pcListing.status,
        customFieldValues: defaultCustomFieldValues,
      },
    })

  const selectedEmulatorId = watch('emulatorId')
  const selectedOs = watch('os')

  const { query: customFieldsQuery, summary: customFieldDefinitionsForSummary } =
    useEmulatorCustomFields(selectedEmulatorId)

  useEffect(() => {
    if (!customFieldsQuery.data) return
    const raw = getValues('customFieldValues')
    const current = Array.isArray(raw) ? raw : []
    const nextValues = diffCustomFieldValues(customFieldsQuery.data, current)
    if (nextValues) setValue('customFieldValues', nextValues)
  }, [customFieldsQuery.data, getValues, setValue])

  const onSubmit = (data: UpdatePcListingFormData) => {
    updateMutation.mutate({ ...data, id: props.pcListing.id })
  }

  return (
    <AdminListingEditShell
      id={props.pcListing.id}
      title="PC Listing Details"
      authorName={props.pcListing.author?.name}
      status={props.pcListing.status}
      createdAt={props.pcListing.createdAt}
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
            name="cpuId"
            errors={formState.errors}
            label="CPU"
            placeholder="Search for CPUs..."
            initial={initialCpu}
            loadItems={loadCpuItems}
            optionToLabel={(item) => `${item.brand.name} ${item.modelName}`}
          />
          <AdminAutocompleteField
            control={control}
            name="gpuId"
            errors={formState.errors}
            label="GPU (optional — leave empty for integrated graphics)"
            placeholder="Search for GPUs..."
            initial={initialGpu}
            loadItems={loadGpuItems}
            optionToLabel={(item) => `${item.brand.name} ${item.modelName}`}
            clearAsUndefined
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AdminMemorySizeField register={register} name="memorySize" errors={formState.errors} />
          <AdminOsField control={control} name="os" errors={formState.errors} />
          <AdminOsVersionField register={register} name="osVersion" errors={formState.errors} />
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminPerformanceField control={control} name="performanceId" errors={formState.errors} />
          <AdminStatusField control={control} name="status" errors={formState.errors} />
        </div>

        <AdminPlatformField
          control={control}
          name="platformId"
          compatibility={{ kind: 'os', os: selectedOs }}
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
          fieldLabels={PC_LISTING_FIELD_LABELS}
        />

        <AdminEditActionBar
          onCancel={() => router.push('/admin/pc-listing-approvals')}
          isSubmitting={updateMutation.isPending}
          isDirty={formState.isDirty}
        />
      </form>
    </AdminListingEditShell>
  )
}

export default PcListingEditForm
