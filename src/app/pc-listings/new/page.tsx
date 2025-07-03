'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  Button,
  LoadingSpinner,
  Autocomplete,
  SelectInput,
  Input,
} from '@/components/ui'
import { MarkdownEditor } from '@/components/ui/form'
import useMounted from '@/hooks/useMounted'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { useRecaptchaForCreateListing } from '@/lib/captcha/hooks'
import toast from '@/lib/toast'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { PcOs } from '@orm'
import createDynamicPcListingSchema, {
  type CustomFieldDefinitionWithOptions,
} from './form-schemas/createDynamicPcListingSchema'
import { FormValidationSummary } from '../../listings/components/shared'

export type PcListingFormValues = RouterInput['pcListings']['create']

type CpuOption = RouterOutput['cpus']['get']['cpus'][number]
type GpuOption = RouterOutput['gpus']['get']['gpus'][number]
type PcPresetOption = RouterOutput['pcListings']['presets']['get'][number]
type GameOption = RouterOutput['games']['get']['games'][number]
type EmulatorOption = RouterOutput['emulators']['get']['emulators'][number]

const OS_OPTIONS = [
  { value: PcOs.WINDOWS, label: 'Windows' },
  { value: PcOs.LINUX, label: 'Linux' },
  { value: PcOs.MACOS, label: 'macOS' },
]

function AddPcListingPage() {
  const router = useRouter()
  const mounted = useMounted()

  const [selectedGame, setSelectedGame] = useState<GameOption | null>(null)
  const [selectedEmulator, setSelectedEmulator] =
    useState<EmulatorOption | null>(null)
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<
    CustomFieldDefinitionWithOptions[]
  >([])

  const createPcListing = api.pcListings.create.useMutation()
  const performanceScalesQuery = api.performanceScales.get.useQuery()
  const cpusQuery = api.cpus.get.useQuery({ limit: 500 })
  const gpusQuery = api.gpus.get.useQuery({ limit: 500 })
  const presetsQuery = api.pcListings.presets.get.useQuery({})
  const gamesQuery = api.games.get.useQuery({ limit: 500 })
  const emulatorsQuery = api.emulators.get.useQuery({})
  const recaptchaHook = useRecaptchaForCreateListing()

  const dynamicFormSchema = createDynamicPcListingSchema(customFieldDefinitions)
  const form = useForm<PcListingFormValues>({
    resolver: zodResolver(dynamicFormSchema),
    defaultValues: {
      gameId: '',
      cpuId: '',
      gpuId: '',
      emulatorId: '',
      performanceId: 0,
      memorySize: 16,
      os: PcOs.WINDOWS,
      osVersion: '',
      notes: '',
      customFieldValues: [],
    },
  })

  // Update custom field definitions when emulator changes
  useEffect(() => {
    // TODO: Load custom field definitions for the selected emulator
    setCustomFieldDefinitions([])
  }, [selectedEmulator])

  const onSubmit = useCallback(
    async (data: PcListingFormValues) => {
      try {
        const recaptchaToken =
          (await recaptchaHook.executeForCreateListing?.()) ?? undefined

        const result = await createPcListing.mutateAsync({
          ...data,
          recaptchaToken,
        })

        analytics.listing.created({
          listingId: result.id,
          gameId: data.gameId,
          systemId: selectedGame?.system?.id || '',
          emulatorId: data.emulatorId,
          deviceId: 'pc',
          performanceId: data.performanceId,
          hasCustomFields: customFieldDefinitions.length > 0,
          customFieldCount: customFieldDefinitions.length,
        })

        toast.success(
          'PC listing created! It will be reviewed before going live.',
        )
        router.push(`/pc-listings/${result.id}`)
      } catch (error) {
        const message = getErrorMessage(error)
        toast.error(`Failed to create PC listing: ${message}`)
      }
    },
    [
      createPcListing,
      recaptchaHook,
      router,
      customFieldDefinitions.length,
      selectedGame?.system?.id,
    ],
  )

  const handlePresetSelect = (preset: PcPresetOption) => {
    form.setValue('cpuId', preset.cpuId)
    form.setValue('gpuId', preset.gpuId)
    form.setValue('memorySize', preset.memorySize)
    form.setValue('os', preset.os)
    form.setValue('osVersion', preset.osVersion)
  }

  const formatCpuLabel = (cpu: CpuOption) =>
    `${cpu.brand.name} ${cpu.modelName}`
  const formatGpuLabel = (gpu: GpuOption) =>
    `${gpu.brand.name} ${gpu.modelName}`
  const formatGameLabel = (game: GameOption) =>
    `${game.title} (${game.system.name})`
  const formatEmulatorLabel = (emulator: EmulatorOption) => emulator.name

  if (!mounted) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/pc-listings"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to PC Listings
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create PC Compatibility Listing
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Share your PC gaming experience with emulators
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* PC Preset Quick Select */}
            {presetsQuery.data && presetsQuery.data.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                  Quick Fill from PC Preset
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {presetsQuery.data.map((preset) => (
                    <Button
                      key={preset.id}
                      type="button"
                      variant="outline"
                      onClick={() => handlePresetSelect(preset)}
                      className="p-3 h-auto text-left justify-start"
                    >
                      <div>
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {preset.cpu.brand.name} {preset.cpu.modelName}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {preset.gpu.brand.name} {preset.gpu.modelName}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Game Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Game *
              </label>
              <Controller
                control={form.control}
                name="gameId"
                render={({ field }) => (
                  <Autocomplete
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value || '')
                      const game = gamesQuery.data?.games.find(
                        (g) => g.id === value,
                      )
                      setSelectedGame(game || null)
                    }}
                    items={gamesQuery.data?.games ?? []}
                    optionToValue={(game) => game.id}
                    optionToLabel={formatGameLabel}
                    placeholder="Select a game..."
                    className="w-full"
                    filterKeys={['title']}
                  />
                )}
              />
              {form.formState.errors.gameId && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.gameId.message}
                </p>
              )}
            </div>

            {/* CPU Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CPU *
              </label>
              <Controller
                control={form.control}
                name="cpuId"
                render={({ field }) => (
                  <Autocomplete
                    value={field.value}
                    onChange={(value) => field.onChange(value || '')}
                    items={cpusQuery.data?.cpus ?? []}
                    optionToValue={(cpu) => cpu.id}
                    optionToLabel={formatCpuLabel}
                    placeholder="Select a CPU..."
                    className="w-full"
                    filterKeys={['modelName']}
                  />
                )}
              />
              {form.formState.errors.cpuId && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.cpuId.message}
                </p>
              )}
            </div>

            {/* GPU Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GPU *
              </label>
              <Controller
                control={form.control}
                name="gpuId"
                render={({ field }) => (
                  <Autocomplete
                    value={field.value}
                    onChange={(value) => field.onChange(value || '')}
                    items={gpusQuery.data?.gpus ?? []}
                    optionToValue={(gpu) => gpu.id}
                    optionToLabel={formatGpuLabel}
                    placeholder="Select a GPU..."
                    className="w-full"
                    filterKeys={['modelName']}
                  />
                )}
              />
              {form.formState.errors.gpuId && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.gpuId.message}
                </p>
              )}
            </div>

            {/* Memory Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                RAM (GB) *
              </label>
              <Controller
                control={form.control}
                name="memorySize"
                render={({ field }) => (
                  <Input
                    type="number"
                    {...field}
                    min="1"
                    max="256"
                    placeholder="e.g., 16"
                    className="w-full"
                  />
                )}
              />
              {form.formState.errors.memorySize && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.memorySize.message}
                </p>
              )}
            </div>

            {/* Operating System */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Operating System *
              </label>
              <Controller
                control={form.control}
                name="os"
                render={({ field }) => (
                  <SelectInput
                    label="Operating System"
                    hideLabel
                    options={OS_OPTIONS.map((opt) => ({
                      id: opt.value,
                      name: opt.label,
                    }))}
                    value={field.value}
                    onChange={(ev) => field.onChange(ev.target.value as PcOs)}
                  />
                )}
              />
              {form.formState.errors.os && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.os.message}
                </p>
              )}
            </div>

            {/* OS Version */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                OS Version *
              </label>
              <Controller
                control={form.control}
                name="osVersion"
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="e.g., Windows 11 Pro, Ubuntu 22.04, macOS Sonoma"
                    className="w-full"
                  />
                )}
              />
              {form.formState.errors.osVersion && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.osVersion.message}
                </p>
              )}
            </div>

            {/* Emulator Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Emulator *
              </label>
              <Controller
                control={form.control}
                name="emulatorId"
                render={({ field }) => (
                  <Autocomplete
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value || '')
                      const emulator = emulatorsQuery.data?.emulators.find(
                        (e) => e.id === value,
                      )
                      setSelectedEmulator(emulator || null)
                    }}
                    items={
                      emulatorsQuery.data?.emulators.filter(
                        (emulator) =>
                          !selectedGame ||
                          emulator.systems.some(
                            (s) => s.id === selectedGame.system.id,
                          ),
                      ) ?? []
                    }
                    optionToValue={(emulator) => emulator.id}
                    optionToLabel={formatEmulatorLabel}
                    placeholder="Select an emulator..."
                    className="w-full"
                    filterKeys={['name']}
                  />
                )}
              />
              {form.formState.errors.emulatorId && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.emulatorId.message}
                </p>
              )}
            </div>

            {/* Performance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Performance *
              </label>
              <Controller
                control={form.control}
                name="performanceId"
                render={({ field }) => (
                  <SelectInput
                    label="Performance"
                    hideLabel
                    options={
                      performanceScalesQuery.data?.map((p) => ({
                        id: String(p.id),
                        name: p.label,
                      })) ?? []
                    }
                    value={String(field.value ?? '')}
                    onChange={(ev) => field.onChange(Number(ev.target.value))}
                  />
                )}
              />
              {form.formState.errors.performanceId && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.performanceId.message}
                </p>
              )}
            </div>

            {/* Custom Fields - TODO: Implement proper custom field handling */}
            {customFieldDefinitions.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {selectedEmulator?.name} Settings
                </h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Custom fields for {selectedEmulator?.name} will be available
                    in a future update.
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <Controller
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <MarkdownEditor
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Share additional details about your experience..."
                    error={form.formState.errors.notes?.message}
                  />
                )}
              />
            </div>

            <FormValidationSummary errors={form.formState.errors} />

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={form.formState.isSubmitting}
                disabled={form.formState.isSubmitting}
              >
                Create PC Listing
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function AddPcListingPageWithSuspense() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AddPcListingPage />
    </Suspense>
  )
}

export default AddPcListingPageWithSuspense
