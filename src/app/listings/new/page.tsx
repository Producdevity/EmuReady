'use client'

import GitHubIcon from '@/components/icons/GitHubIcon'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { twMerge } from 'tailwind-merge'
import { z } from 'zod'
import { api } from '@/lib/api'
import {
  CustomFieldType,
  type CustomFieldDefinition as PrismaCustomFieldDefinition,
} from '@orm'
import {
  Input,
  Button,
  SelectInput,
  Autocomplete,
  type AutocompleteOptionBase,
} from '@/components/ui'
import {
  Gamepad2,
  Puzzle,
  HardDrive,
  Zap,
  ListChecks,
  FileText,
  CheckSquare,
  LinkIcon,
  CaseSensitive,
  AlertCircle,
  Info,
} from 'lucide-react'
import toast from '@/lib/toast'
import useMounted from '@/hooks/useMounted'

// TODO: share schema with server-side validation
const listingFormSchema = z.object({
  gameId: z.string().min(1, 'Game is required'),
  deviceId: z.string().min(1, 'Device is required'),
  emulatorId: z.string().min(1, 'Emulator is required'),
  performanceId: z.coerce.number().min(1, 'Performance rating is required'),
  notes: z.string().optional(),
  // Placeholder for custom field values - will be dynamically built
  customFieldValues: z
    .array(
      z.object({
        customFieldDefinitionId: z.string(),
        value: z.any(), // Will be refined based on field type
      }),
    )
    .optional(),
})

type ListingFormValues = z.infer<typeof listingFormSchema>

interface GameOption extends AutocompleteOptionBase {
  id: string
  title: string
  system: {
    id: string
    name: string
  }
}

interface EmulatorOption extends AutocompleteOptionBase {
  id: string
  name: string
  systems: Array<{
    id: string
    name: string
  }>
}

interface CustomFieldOptionUI {
  value: string
  label: string
}

interface CustomFieldDefinitionWithOptions extends PrismaCustomFieldDefinition {
  parsedOptions?: CustomFieldOptionUI[]
}

function AddListingPage() {
  const router = useRouter()
  const mounted = useMounted()
  const utils = api.useUtils()

  const [emulatorInputFocus, setEmulatorInputFocus] = useState(false)
  const [gameSearchTerm, setGameSearchTerm] = useState('')
  const [emulatorSearchTerm, setEmulatorSearchTerm] = useState('')
  const [selectedGame, setSelectedGame] = useState<GameOption | null>(null)
  const [availableEmulators, setAvailableEmulators] = useState<
    EmulatorOption[]
  >([])
  const [parsedCustomFields, setParsedCustomFields] = useState<
    CustomFieldDefinitionWithOptions[]
  >([])

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      gameId: '',
      deviceId: '',
      emulatorId: '',
      performanceId: undefined,
      notes: '',
      customFieldValues: [],
    },
  })

  const selectedEmulatorId = watch('emulatorId')
  const selectedGameId = watch('gameId')

  // Data fetching for Autocomplete options
  const { data: devicesData } = api.devices.get.useQuery({ limit: 1000 })
  const { data: performanceScalesData } =
    api.listings.performanceScales.useQuery()
  const { data: customFieldDefinitionsData, isLoading: isLoadingCustomFields } =
    api.customFieldDefinitions.getByEmulator.useQuery(
      { emulatorId: selectedEmulatorId! },
      { enabled: !!selectedEmulatorId },
    )

  // Autocomplete loadItems functions
  const loadGameItems = useCallback(
    async (query: string): Promise<GameOption[]> => {
      setGameSearchTerm(query)
      if (query.length < 2) return Promise.resolve([])
      try {
        const result = await utils.games.get.fetch({ search: query, limit: 20 })
        return (
          result.games.map((g) => ({
            id: g.id,
            title: g.title,
            system: g.system,
          })) ?? []
        )
      } catch (error) {
        console.error('Error fetching games:', error)
        return []
      }
    },
    [utils.games.get],
  )

  const loadEmulatorItems = useCallback(
    async (query: string): Promise<EmulatorOption[]> => {
      setEmulatorSearchTerm(query)

      // If no game is selected, show a message instead of loading emulators
      if (!selectedGame) return Promise.resolve([])

      try {
        const result = await utils.emulators.get.fetch({ search: query })
        console.log('Fetched emulators:', result)

        // Get full emulator data with systems for filtering
        const emulatorsWithSystems = await Promise.all(
          result.map(async (emulator) => {
            try {
              const fullEmulator = await utils.emulators.byId.fetch({
                id: emulator.id,
              })
              return fullEmulator
                ? {
                    id: fullEmulator.id,
                    name: fullEmulator.name,
                    systems: fullEmulator.systems,
                  }
                : {
                    id: emulator.id,
                    name: emulator.name,
                    systems: [],
                  }
            } catch {
              return {
                id: emulator.id,
                name: emulator.name,
                systems: [],
              }
            }
          }),
        )

        // Filter to only emulators that support the selected game's system
        const compatibleEmulators = emulatorsWithSystems.filter((emulator) =>
          emulator.systems.some(
            (system) => system.id === selectedGame.system.id,
          ),
        )

        setAvailableEmulators(compatibleEmulators)
        return compatibleEmulators
      } catch (error) {
        console.error('Error fetching emulators:', error)
        return []
      }
    },
    [utils.emulators.get, utils.emulators.byId, selectedGame],
  )

  // Update selected game when gameId changes
  useEffect(() => {
    if (selectedGameId && !selectedGame) {
      // Try to find the game in recent searches or fetch it
      loadGameItems(gameSearchTerm).then((games) => {
        const game = games.find((g) => g.id === selectedGameId)
        if (game) setSelectedGame(game)
      })
    } else if (!selectedGameId) {
      setSelectedGame(null)
      setAvailableEmulators([])
      setValue('emulatorId', '') // Clear emulator when game is cleared
    }
  }, [selectedGameId, selectedGame, gameSearchTerm, loadGameItems, setValue])

  // Clear emulator when game changes
  useEffect(() => {
    if (selectedGame) {
      setValue('emulatorId', '') // Clear emulator selection when game changes
      setAvailableEmulators([]) // Clear available emulators
    }
  }, [selectedGame, setValue])

  useEffect(() => {
    if (customFieldDefinitionsData) {
      const parsed = customFieldDefinitionsData.map(
        (field): CustomFieldDefinitionWithOptions => {
          let parsedOptions: CustomFieldOptionUI[] | undefined = undefined
          if (
            field.type === CustomFieldType.SELECT &&
            Array.isArray(field.options)
          ) {
            parsedOptions = field.options.reduce(
              (acc: CustomFieldOptionUI[], opt: unknown) => {
                if (
                  typeof opt === 'object' &&
                  opt !== null &&
                  'value' in opt &&
                  'label' in opt
                ) {
                  const knownOpt = opt as { value: unknown; label: unknown }
                  acc.push({
                    value: String(knownOpt.value),
                    label: String(knownOpt.label),
                  })
                }
                return acc
              },
              [],
            )
          }
          return { ...field, parsedOptions }
        },
      )
      setParsedCustomFields(parsed)

      const currentCustomValues = watch('customFieldValues') ?? []
      const newCustomValues = parsed.map((field) => {
        const existingValueObj = currentCustomValues.find(
          (cv) => cv.customFieldDefinitionId === field.id,
        )
        if (existingValueObj) return existingValueObj
        let defaultValue: string | boolean | number | null | undefined
        switch (field.type) {
          case CustomFieldType.BOOLEAN:
            defaultValue = false
            break
          case CustomFieldType.SELECT:
            defaultValue = field.parsedOptions?.[0]?.value ?? ''
            break
          default:
            defaultValue = ''
        }
        return {
          customFieldDefinitionId: field.id,
          value: defaultValue,
        }
      })
      setValue('customFieldValues', newCustomValues)
    }
  }, [customFieldDefinitionsData, setValue, watch])

  const createListingMutation = api.listings.create.useMutation({
    onSuccess: () => {
      toast.success('Listing created successfully!')
      router.push('/listings')
    },
    onError: (error) => {
      toast.error(`Error creating listing: ${error.message}`)
    },
  })

  const onSubmit = (data: ListingFormValues) => {
    createListingMutation.mutate(data)
  }

  const renderCustomField = (
    fieldDef: CustomFieldDefinitionWithOptions,
    index: number,
  ) => {
    const fieldName = `customFieldValues.${index}.value` as const
    const errorMessage = errors.customFieldValues?.[index]?.value?.message
    const errorText =
      typeof errorMessage === 'string' ? errorMessage : undefined

    const getIcon = (type: CustomFieldType) => {
      switch (type) {
        case CustomFieldType.TEXT:
          return <CaseSensitive className="w-5 h-5" />
        case CustomFieldType.TEXTAREA:
          return <FileText className="w-5 h-5" />
        case CustomFieldType.URL:
          return <LinkIcon className="w-5 h-5" />
        case CustomFieldType.BOOLEAN:
          return <CheckSquare className="w-5 h-5" />
        case CustomFieldType.SELECT:
          return <ListChecks className="w-5 h-5" />
        default:
          return <FileText className="w-5 h-5" />
      }
    }

    const icon = getIcon(fieldDef.type)

    switch (fieldDef.type) {
      case CustomFieldType.TEXT:
      case CustomFieldType.URL:
        return (
          <div key={fieldDef.id} className="mb-4">
            <label
              htmlFor={fieldName}
              className="pl-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {fieldDef.label} {fieldDef.isRequired && '*'}
            </label>
            <Controller
              name={fieldName}
              control={control}
              defaultValue=""
              render={({ field }) => (
                <Input
                  className="mt-2"
                  id={fieldName}
                  leftIcon={icon}
                  value={field.value as string}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={`Enter ${fieldDef.label.toLowerCase()}`}
                />
              )}
            />
            {errorText && (
              <p className="text-red-500 text-xs mt-1">{errorText}</p>
            )}
          </div>
        )
      case CustomFieldType.TEXTAREA:
        return (
          <div key={fieldDef.id} className="mb-4">
            <label
              htmlFor={fieldName}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {fieldDef.label} {fieldDef.isRequired && '*'}
            </label>
            <Controller
              name={fieldName}
              control={control}
              defaultValue=""
              render={({ field }) => (
                <Input
                  as="textarea"
                  id={fieldName}
                  leftIcon={icon}
                  value={field.value as string}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={`Enter ${fieldDef.label.toLowerCase()}`}
                  rows={3}
                />
              )}
            />
            {errorText && (
              <p className="text-red-500 text-xs mt-1">{errorText}</p>
            )}
          </div>
        )
      case CustomFieldType.BOOLEAN:
        return (
          <div key={fieldDef.id} className="mb-4">
            <Controller
              name={fieldName}
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <label
                  htmlFor={fieldName}
                  className="flex items-center cursor-pointer"
                >
                  <input
                    type="checkbox"
                    id={fieldName}
                    checked={field.value as boolean}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <span className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    {icon}
                    <span className="ml-2">
                      {fieldDef.label} {fieldDef.isRequired && '*'}
                    </span>
                  </span>
                </label>
              )}
            />
            {errorText && (
              <p className="text-red-500 text-xs mt-1 ml-6">{errorText}</p>
            )}
          </div>
        )
      case CustomFieldType.SELECT:
        return (
          <div key={fieldDef.id} className="mb-4">
            <label
              htmlFor={fieldName}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {fieldDef.label} {fieldDef.isRequired && '*'}
            </label>
            <Controller
              name={fieldName}
              control={control}
              defaultValue={fieldDef.parsedOptions?.[0]?.value ?? ''}
              render={({ field }) => (
                <SelectInput
                  label={fieldDef.label}
                  leftIcon={icon}
                  options={
                    fieldDef.parsedOptions?.map((opt) => ({
                      id: opt.value,
                      name: opt.label,
                    })) ?? []
                  }
                  value={field.value as string}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            {errorText && (
              <p className="text-red-500 text-xs mt-1">{errorText}</p>
            )}
          </div>
        )
      default:
        return null
    }
  }

  if (!mounted) return null

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Create New Listing
        </h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl"
        >
          {/* Game Selection */}
          <div>
            <Controller
              name="gameId"
              control={control}
              render={({ field }) => (
                <Autocomplete<GameOption>
                  label="Game"
                  leftIcon={<Puzzle className="w-5 h-5" />}
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value)
                    // Find and set the selected game
                    if (!value) return setSelectedGame(null)

                    loadGameItems(gameSearchTerm).then((games) => {
                      const game = games.find((g) => g.id === value)
                      if (game) setSelectedGame(game)
                    })
                  }}
                  loadItems={loadGameItems}
                  optionToValue={(item) => item.id}
                  optionToLabel={(item) =>
                    `${item.title} (${item.system.name})`
                  }
                  placeholder="Search for a game..."
                  minCharsToTrigger={2}
                />
              )}
            />
            {errors.gameId && (
              <p className="text-red-500 text-xs mt-1">
                {String(errors.gameId.message ?? '')}
              </p>
            )}
            {selectedGame && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                  <Info className="w-4 h-4 mr-2" />
                  <span>
                    Selected: <strong>{selectedGame.title}</strong> for{' '}
                    <strong>{selectedGame.system.name}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Device Selection */}
          <div>
            <Controller
              name="deviceId"
              control={control}
              render={({ field }) => (
                <SelectInput
                  label="Device"
                  leftIcon={<HardDrive className="w-5 h-5" />}
                  options={
                    devicesData?.map((d) => ({
                      id: d.id,
                      name: `${d.brand.name} ${d.modelName}`,
                    })) ?? []
                  }
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            {errors.deviceId && (
              <p className="text-red-500 text-xs mt-1">
                {String(errors.deviceId.message ?? '')}
              </p>
            )}
          </div>

          {/* Emulator Selection */}
          <div>
            {!selectedGame ? (
              <>
                <label
                  htmlFor="emulatorId"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Emulator
                </label>
                <div className="mt-1 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center text-sm text-yellow-700 dark:text-yellow-300">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span>
                      Please select a game first to see compatible emulators
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Controller
                  name="emulatorId"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete<EmulatorOption>
                      label="Emulator"
                      leftIcon={<Gamepad2 className="w-5 h-5" />}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value)
                        // reset, setting customFieldValues is handled in useEffect
                        setValue('customFieldValues', [])
                      }}
                      onFocus={() => setEmulatorInputFocus(true)}
                      onBlur={() => setEmulatorInputFocus(false)}
                      loadItems={loadEmulatorItems}
                      optionToValue={(item) => item.id}
                      optionToLabel={(item) => item.name}
                      placeholder={`Search for emulators that support ${selectedGame.system.name}...`}
                      minCharsToTrigger={1}
                    />
                  )}
                />
                {availableEmulators.length === 0 &&
                  selectedGame &&
                  emulatorSearchTerm.length >= 1 && (
                    <div
                      className={twMerge(
                        'p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800',
                        emulatorInputFocus ? 'mt-14' : 'mt-2',
                      )}
                    >
                      <div className="flex items-center text-sm text-orange-700 dark:text-orange-300">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span>
                          No emulators found that support{' '}
                          <strong>{selectedGame.system.name}</strong>. Try a
                          different search term, or request to add your emulator
                          by opening a GitHub issue.
                          <a
                            href="https://github.com/Producdevity/EmuReady/issues/new?template=emulator_request.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Request Emulator on GitHub"
                            className="ml-1 underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                          >
                            <GitHubIcon className="inline w-4 h-4 mr-1" />
                            Request Emulator
                          </a>
                        </span>
                      </div>
                    </div>
                  )}
              </>
            )}
            {errors.emulatorId && (
              <p className="text-red-500 text-xs mt-1">
                {String(errors.emulatorId.message ?? '')}
              </p>
            )}
          </div>

          {/* Performance Selection */}
          <div>
            <Controller
              name="performanceId"
              control={control}
              render={({ field }) => (
                <SelectInput
                  label="Performance"
                  leftIcon={<Zap className="w-5 h-5" />}
                  options={
                    performanceScalesData?.map((p) => ({
                      id: String(p.id),
                      name: p.label,
                    })) ?? []
                  }
                  value={String(field.value ?? '')}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
            {errors.performanceId && (
              <p className="text-red-500 text-xs mt-1">
                {String(errors.performanceId.message ?? '')}
              </p>
            )}
            {/*  TODO: show the description of the performance scale*/}
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Notes
            </label>
            <Input
              as="textarea"
              id="notes"
              {...register('notes')}
              leftIcon={<FileText className="w-5 h-5" />}
              rows={4}
              className="mt-1 w-full"
              placeholder="Share your experience, settings, or any additional details..."
            />
            {errors.notes && (
              <p className="text-red-500 text-xs mt-1">
                {String(errors.notes.message ?? '')}
              </p>
            )}
          </div>

          {/* Dynamic Custom Fields Section */}
          {selectedEmulatorId && isLoadingCustomFields && (
            <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                Loading emulator-specific fields...
              </p>
            </div>
          )}
          {selectedEmulatorId &&
            !isLoadingCustomFields &&
            parsedCustomFields.length > 0 && (
              <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                  Emulator-Specific Details
                  {customFieldDefinitionsData?.[0]?.emulator?.name && (
                    <span className="text-base font-normal text-gray-600 dark:text-gray-400 ml-2">
                      ({customFieldDefinitionsData[0].emulator.name})
                    </span>
                  )}
                </h2>
                {parsedCustomFields.map(renderCustomField)}
              </div>
            )}

          <div className="flex justify-end pt-8">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              size="lg"
            >
              Create Listing
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddListingPage
