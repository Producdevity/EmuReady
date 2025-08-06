'use client'

import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type KeyboardEvent,
} from 'react'
import { Controller, useForm } from 'react-hook-form'
import { isString } from 'remeda'
import {
  CustomFieldRenderer,
  FormValidationSummary,
  EmulatorSelector,
  GameSelector,
  type EmulatorOption,
  type GameOption,
} from '@/app/listings/components/shared'
import {
  Autocomplete,
  Button,
  Input,
  LoadingSpinner,
  SelectInput,
} from '@/components/ui'
import useMounted from '@/hooks/useMounted'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { useRecaptchaForCreateListing } from '@/lib/captcha/hooks'
import { MarkdownEditor } from '@/lib/dynamic-imports'
import toast from '@/lib/toast'
import { type RouterInput, type RouterOutput } from '@/types/trpc'
import {
  parseCustomFieldOptions,
  getCustomFieldDefaultValue,
} from '@/utils/customFields'
import getErrorMessage from '@/utils/getErrorMessage'
import { PcOs } from '@orm'
import createDynamicPcListingSchema, {
  type CustomFieldDefinitionWithOptions,
} from './form-schemas/createDynamicPcListingSchema'

export type PcListingFormValues = RouterInput['pcListings']['create']

type CpuOption = RouterOutput['cpus']['get']['cpus'][number]
type GpuOption = RouterOutput['gpus']['get']['gpus'][number]
type PcPresetOption = RouterOutput['pcListings']['presets']['get'][number]

const OS_OPTIONS = [
  { value: PcOs.WINDOWS, label: 'Windows' },
  { value: PcOs.LINUX, label: 'Linux' },
  { value: PcOs.MACOS, label: 'macOS' },
]

function AddPcListingPage() {
  const router = useRouter()
  const mounted = useMounted()
  const currentUserQuery = api.users.me.useQuery()

  const [selectedGame, setSelectedGame] = useState<GameOption | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<PcPresetOption | null>(
    null,
  )
  const [gameSearchTerm, setGameSearchTerm] = useState('')
  const [emulatorSearchTerm, setEmulatorSearchTerm] = useState('')
  const [availableEmulators, setAvailableEmulators] = useState<
    EmulatorOption[]
  >([])
  const [emulatorInputFocus, setEmulatorInputFocus] = useState(false)
  const [parsedCustomFields, setParsedCustomFields] = useState<
    CustomFieldDefinitionWithOptions[]
  >([])
  const [schemaState, setSchemaState] = useState<
    ReturnType<typeof createDynamicPcListingSchema>
  >(createDynamicPcListingSchema([]))

  const utils = api.useUtils()
  const createPcListing = api.pcListings.create.useMutation()
  const performanceScalesQuery = api.performanceScales.get.useQuery()
  const presetsQuery = api.pcListings.presets.get.useQuery({})
  const recaptchaHook = useRecaptchaForCreateListing()

  // Async load functions for autocomplete
  // TODO: consider abstracting these into a shared hook
  const loadGameItems = useCallback(
    async (query: string): Promise<GameOption[]> => {
      setGameSearchTerm(query)
      if (query.length < 2) return Promise.resolve([])
      try {
        // Windows Games are filtered out server-side
        const result = await utils.games.get.fetch({ search: query, limit: 20 })
        return (
          result.games.map((game) => ({
            id: game.id,
            title: game.title,
            system: game.system || { id: game.systemId, name: 'Unknown' },
            status: game.status,
          })) ?? []
        )
      } catch (error) {
        console.error('Error fetching games:', error)
        return []
      }
    },
    [utils.games.get],
  )

  const loadCpuItems = useCallback(
    async (query: string): Promise<CpuOption[]> => {
      if (query.length < 2) return Promise.resolve([])
      try {
        const result = await utils.cpus.get.fetch({ search: query, limit: 20 })
        return result.cpus ?? []
      } catch (error) {
        console.error('Error fetching CPUs:', error)
        return []
      }
    },
    [utils.cpus.get],
  )

  const loadGpuItems = useCallback(
    async (query: string): Promise<GpuOption[]> => {
      if (query.length < 2) return Promise.resolve([])
      try {
        const result = await utils.gpus.get.fetch({ search: query, limit: 20 })
        return result.gpus ?? []
      } catch (error) {
        console.error('Error fetching GPUs:', error)
        return []
      }
    },
    [utils.gpus.get],
  )

  const loadEmulatorItems = useCallback(
    async (query: string): Promise<EmulatorOption[]> => {
      setEmulatorSearchTerm(query)

      if (!selectedGame) {
        setAvailableEmulators([])
        return Promise.resolve([])
      }

      try {
        const result = await utils.emulators.get.fetch({ search: query })

        // Filter to only emulators that support the selected game's system
        const filteredEmulators = result.emulators
          .filter((emulator) =>
            emulator.systems.some(
              (system) => system.id === selectedGame.system.id,
            ),
          )
          .map((emulator) => ({
            id: emulator.id,
            name: emulator.name,
            systems: emulator.systems,
          }))

        // Update the availableEmulators state for the warning logic
        setAvailableEmulators(filteredEmulators)
        return filteredEmulators
      } catch (error) {
        console.error('Error fetching emulators:', error)
        setAvailableEmulators([])
        return []
      }
    },
    [utils.emulators.get, selectedGame],
  )

  const form = useForm<PcListingFormValues>({
    resolver: zodResolver(schemaState),
    defaultValues: {
      gameId: '',
      cpuId: '',
      gpuId: undefined, // Optional for integrated graphics
      emulatorId: '',
      performanceId: 0,
      memorySize: 16,
      os: PcOs.WINDOWS,
      osVersion: '',
      notes: '',
      customFieldValues: [],
    },
  })

  const selectedEmulatorId = form.watch('emulatorId')
  const customFieldDefinitionsQuery =
    api.customFieldDefinitions.getByEmulator.useQuery(
      { emulatorId: selectedEmulatorId },
      { enabled: !!selectedEmulatorId && selectedEmulatorId.trim() !== '' },
    )

  // Update custom field definitions when emulator changes
  useEffect(() => {
    if (!customFieldDefinitionsQuery.data) return

    const parsed = customFieldDefinitionsQuery.data.map(
      (field): CustomFieldDefinitionWithOptions => {
        const parsedOptions = parseCustomFieldOptions(field)
        return {
          ...field,
          parsedOptions,
          defaultValue: field.defaultValue as
            | string
            | number
            | boolean
            | null
            | undefined,
        }
      },
    )
    setParsedCustomFields(parsed)

    // Create and set the dynamic schema
    const dynamicSchema = createDynamicPcListingSchema(parsed)
    setSchemaState(dynamicSchema)

    // Store the form values before updating the resolver
    const currentValues = form.getValues()

    // Release form state first
    form.reset()

    // Update the form with new schema and restore values
    form.reset(currentValues)

    const currentCustomValues = form.watch('customFieldValues') ?? []
    const newCustomValues = parsed.map((field) => {
      const existingValueObj = currentCustomValues.find(
        (cv) => cv.customFieldDefinitionId === field.id,
      )
      if (existingValueObj) return existingValueObj

      const defaultValue = getCustomFieldDefaultValue(
        field,
        field.parsedOptions,
      )

      return {
        customFieldDefinitionId: field.id,
        value: defaultValue,
      }
    })
    form.setValue('customFieldValues', newCustomValues)
  }, [customFieldDefinitionsQuery.data, form])

  // Clear emulator when game changes and load initial emulators
  useEffect(() => {
    if (selectedGame) {
      form.setValue('emulatorId', '') // Clear emulator selection when game changes
      // Load initial emulators for the selected game system
      loadEmulatorItems('').catch(console.error)
    } else {
      setAvailableEmulators([])
    }
  }, [selectedGame, form, loadEmulatorItems])

  const onSubmit = useCallback(
    async (data: PcListingFormValues) => {
      if (!currentUserQuery.data?.id) {
        return toast.error('Yu must be signed in to create a listing.')
      }
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
          hasCustomFields: parsedCustomFields.length > 0,
          customFieldCount: parsedCustomFields.length,
        })

        // Invalidate queries to refresh data
        await utils.pcListings.get.invalidate()
        if (data.gameId) {
          await utils.games.byId.invalidate({ id: data.gameId })
        }

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
      currentUserQuery.data?.id,
      recaptchaHook,
      createPcListing,
      selectedGame?.system?.id,
      parsedCustomFields.length,
      router,
      utils,
    ],
  )

  const handlePresetSelect = (preset: PcPresetOption) => {
    setSelectedPreset(preset)
    form.setValue('cpuId', preset.cpuId)
    form.setValue('gpuId', preset.gpuId || undefined) // Handle optional GPU
    form.setValue('memorySize', preset.memorySize)
    form.setValue('os', preset.os)
    form.setValue('osVersion', preset.osVersion)
  }

  const handleClearPreset = () => {
    setSelectedPreset(null)
    form.setValue('cpuId', '')
    form.setValue('gpuId', undefined) // Set to undefined for optional field
    form.setValue('memorySize', 16)
    form.setValue('os', PcOs.WINDOWS)
    form.setValue('osVersion', '')
  }

  const formatCpuLabel = (cpu: CpuOption) =>
    `${cpu.brand.name} ${cpu.modelName}`
  const formatGpuLabel = (gpu: GpuOption) =>
    `${gpu.brand.name} ${gpu.modelName}`

  // Prevent form submission on Enter key press
  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter' && event.target instanceof HTMLElement) {
      // Allow Enter key in textareas for line breaks
      if (event.target.tagName.toLowerCase() === 'textarea') return
      // Prevent form submission for all other elements
      event.preventDefault()
    }
  }

  if (!mounted) return null

  if (!currentUserQuery.data?.id) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Who this?</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to create a new listing.
          </p>

          <div className="mt-4">
            <SignInButton mode="modal">
              <p className="p-3 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                <span className="block text-gray-900 dark:text-white font-medium">
                  Login
                </span>
              </p>
            </SignInButton>

            <SignUpButton mode="modal">
              <p className="p-3 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                <span className="block text-gray-900 dark:text-white font-medium">
                  Sign Up
                </span>
              </p>
            </SignUpButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full md:max-w-3xl lg:mx-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Create PC Compatibility Listing
        </h1>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onKeyDown={handleKeyDown}
          className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl"
        >
          {/* PC Preset Selection */}
          {presetsQuery.data && presetsQuery.data.length > 0 && (
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Use PC Preset
                </h3>
                {selectedPreset && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearPreset}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Clear & Use Custom
                  </Button>
                )}
              </div>

              {selectedPreset ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {selectedPreset.name}
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearPreset}
                    >
                      Change Preset
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          CPU:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedPreset.cpu.brand.name}{' '}
                          {selectedPreset.cpu.modelName}
                        </span>
                      </div>
                      {selectedPreset.gpu && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            GPU:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedPreset.gpu.brand.name}{' '}
                            {selectedPreset.gpu.modelName}
                          </span>
                        </div>
                      )}
                      {!selectedPreset.gpu && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            GPU:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            Integrated Graphics
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Memory:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedPreset.memorySize}GB RAM
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          OS:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {
                            OS_OPTIONS.find(
                              (opt) => opt.value === selectedPreset.os,
                            )?.label
                          }{' '}
                          {selectedPreset.osVersion}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {presetsQuery.data.map((preset) => (
                    <Button
                      key={preset.id}
                      type="button"
                      variant="outline"
                      onClick={() => handlePresetSelect(preset)}
                      className="p-4 h-auto text-left justify-start hover:bg-white dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="w-full">
                        <div className="font-medium text-gray-900 dark:text-white mb-2">
                          {preset.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <div>
                            {preset.cpu.brand.name} {preset.cpu.modelName}
                          </div>
                          <div>
                            {preset.gpu
                              ? `${preset.gpu.brand.name} ${preset.gpu.modelName}`
                              : 'Integrated Graphics'}
                          </div>
                          <div>
                            {preset.memorySize}GB •{' '}
                            {
                              OS_OPTIONS.find((opt) => opt.value === preset.os)
                                ?.label
                            }
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Game Selection */}
          <div>
            <GameSelector<PcListingFormValues>
              control={form.control}
              name="gameId"
              selectedGame={selectedGame}
              errorMessage={form.formState.errors.gameId?.message}
              loadGameItems={loadGameItems}
              onGameSelect={(game: GameOption | null) => {
                setSelectedGame(game)
                if (game) return
                form.setValue('emulatorId', '')
                form.setValue('customFieldValues', [])
              }}
              gameSearchTerm={gameSearchTerm}
            />

            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Can&apos;t find your game?{' '}
              <Link
                href="/games/new/search"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
              >
                Add it here
              </Link>
            </div>
          </div>

          {/* PC Specifications - Only show if no preset selected */}
          {!selectedPreset && (
            <div className="space-y-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                PC Specifications
              </h3>

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
                      loadItems={loadCpuItems}
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
                  GPU (Optional - leave blank for integrated graphics)
                </label>
                <Controller
                  control={form.control}
                  name="gpuId"
                  render={({ field }) => (
                    <Autocomplete
                      value={field.value}
                      onChange={(value) => field.onChange(value || '')}
                      loadItems={loadGpuItems}
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
            </div>
          )}

          {/* Helpful message when preset is selected */}
          {selectedPreset && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                <span className="font-medium">
                  PC specs auto-filled from &ldquo;{selectedPreset.name}
                  &rdquo;
                </span>
                <br />
                You can now select your game, emulator, and performance rating
                below.
              </p>
            </div>
          )}

          {/* Emulator Selection */}
          <div>
            <EmulatorSelector<PcListingFormValues>
              control={form.control}
              name="emulatorId"
              selectedGame={selectedGame}
              availableEmulators={availableEmulators}
              emulatorSearchTerm={emulatorSearchTerm}
              emulatorInputFocus={emulatorInputFocus}
              errorMessage={form.formState.errors.emulatorId?.message}
              loadEmulatorItems={loadEmulatorItems}
              setValue={form.setValue}
              onFocus={() => setEmulatorInputFocus(true)}
              onBlur={() => setEmulatorInputFocus(false)}
              customFieldValuesFieldName="customFieldValues"
            />
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

          {/* Notes */}
          <div>
            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <MarkdownEditor
                  {...field}
                  placeholder="Share your experience, settings, or any additional details..."
                  rows={4}
                  label="Notes"
                  id="notes"
                  maxLength={5000}
                  error={form.formState.errors.notes?.message}
                />
              )}
            />
          </div>

          {/* Dynamic Custom Fields Section */}
          {selectedEmulatorId && customFieldDefinitionsQuery.isPending && (
            <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                Loading emulator-specific fields...
              </p>
            </div>
          )}
          {selectedEmulatorId &&
            !customFieldDefinitionsQuery.isPending &&
            parsedCustomFields.length > 0 && (
              <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                  Emulator-Specific Details
                  {customFieldDefinitionsQuery.data?.[0]?.emulator?.name && (
                    <span className="text-base font-normal text-gray-600 dark:text-gray-400 ml-2">
                      ({customFieldDefinitionsQuery.data[0].emulator.name})
                    </span>
                  )}
                </h2>
                {parsedCustomFields.map((fieldDef, index) => {
                  const errorMessage = isString(
                    form.formState.errors.customFieldValues?.[index]?.value
                      ?.message,
                  )
                    ? form.formState.errors.customFieldValues?.[index]?.value
                        ?.message
                    : undefined
                  return (
                    <CustomFieldRenderer
                      key={fieldDef.id}
                      fieldDef={fieldDef}
                      fieldName={`customFieldValues.${index}.value` as const}
                      index={index}
                      control={form.control}
                      errorMessage={errorMessage}
                    />
                  )
                })}
              </div>
            )}

          {/* Form Validation Summary */}
          <FormValidationSummary errors={form.formState.errors} />

          <div className="flex justify-end pt-8">
            <Button
              type="submit"
              variant="primary"
              isLoading={createPcListing.isPending}
              disabled={
                form.formState.isSubmitting ?? createPcListing.isPending
              }
              size="lg"
            >
              Create PC Listing
            </Button>
          </div>
        </form>
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
