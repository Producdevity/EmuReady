'use client'

import { CreateListingSchema } from '@/schemas/listing'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { CustomFieldType, type CustomFieldDefinition } from '@orm'
import {
  Input,
  Button,
  SelectInput,
  type AutocompleteOptionBase,
  LoadingSpinner,
} from '@/components/ui'
import { HardDrive, Zap, FileText } from 'lucide-react'
import toast from '@/lib/toast'
import useMounted from '@/hooks/useMounted'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import CustomFieldRenderer from './components/CustomFieldRenderer'
import FormValidationSummary from './components/FormValidationSummary'
import GameSelector from './components/GameSelector'
import EmulatorSelector from './components/EmulatorSelector'

export type ListingFormValues = RouterInput['listings']['create']

const listingFormSchema = CreateListingSchema.extend({
  gameId: z.string().min(1, 'Game is required'),
  deviceId: z.string().min(1, 'Device is required'),
  emulatorId: z.string().min(1, 'Emulator is required'),
  performanceId: z.coerce.number().min(1, 'Performance rating is required'),
})

// Dynamic schema builder for custom field validation with specific field errors
function createDynamicListingSchema(
  customFields: CustomFieldDefinitionWithOptions[],
) {
  if (customFields.length === 0) return listingFormSchema

  // Create dynamic validation for each custom field
  const customFieldValidation = z
    .array(
      z.object({
        customFieldDefinitionId: z.string().uuid(),
        value: z.any(),
      }),
    )
    .optional()
    .superRefine((values, ctx) => {
      if (!values) return

      customFields.forEach((field, index) => {
        if (!field.isRequired) return

        const fieldValue = values.find(
          (cfv) => cfv.customFieldDefinitionId === field.id,
        )

        let isValid = true
        const errorMessage = `${field.label} is required`

        if (!fieldValue) {
          isValid = false
        } else {
          // Validate based on field type
          switch (field.type) {
            case CustomFieldType.TEXT:
            case CustomFieldType.TEXTAREA:
            case CustomFieldType.URL:
              if (
                !fieldValue.value ||
                (typeof fieldValue.value === 'string' &&
                  fieldValue.value.trim() === '')
              ) {
                isValid = false
              }
              break
            case CustomFieldType.SELECT:
              if (!fieldValue.value || fieldValue.value === '') {
                isValid = false
              }
              break
            case CustomFieldType.BOOLEAN:
              // Boolean fields are always valid (true or false)
              isValid = true
              break
          }
        }

        if (!isValid) {
          // Find the actual index in the values array for this field
          const valueIndex = values.findIndex(
            (v) => v.customFieldDefinitionId === field.id,
          )
          if (valueIndex >= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: errorMessage,
              path: [valueIndex, 'value'],
            })
          } else {
            // If the field value doesn't exist, add it at the expected index
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: errorMessage,
              path: [index, 'value'],
            })
          }
        }
      })
    })

  return listingFormSchema.extend({
    customFieldValues: customFieldValidation,
  })
}

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

interface CustomFieldDefinitionWithOptions extends CustomFieldDefinition {
  parsedOptions?: CustomFieldOptionUI[]
}

function AddListingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mounted = useMounted()
  const utils = api.useUtils()

  const gameIdFromUrl = searchParams.get('gameId')

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
  const [isInitialGameLoaded, setIsInitialGameLoaded] = useState(false)

  const [currentSchema, setCurrentSchema] =
    useState<z.ZodType<ListingFormValues>>(listingFormSchema)

  const { control, register, handleSubmit, watch, setValue, formState } =
    useForm<ListingFormValues>({
      resolver: zodResolver(currentSchema),
      defaultValues: {
        gameId: gameIdFromUrl ?? '',
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

  // Fetch game data if gameId is provided in URL
  const { data: preSelectedGameData } = api.games.byId.useQuery(
    { id: gameIdFromUrl! },
    { enabled: !!gameIdFromUrl && !isInitialGameLoaded },
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

  // Handle pre-selected game from URL parameter
  useEffect(() => {
    if (preSelectedGameData && gameIdFromUrl && !isInitialGameLoaded) {
      const gameOption: GameOption = {
        id: preSelectedGameData.id,
        title: preSelectedGameData.title,
        system: preSelectedGameData.system,
      }
      setSelectedGame(gameOption)
      setValue('gameId', preSelectedGameData.id)
      setIsInitialGameLoaded(true)

      // Set the game search term to help with the autocomplete display
      setGameSearchTerm(preSelectedGameData.title)
    }
  }, [preSelectedGameData, gameIdFromUrl, isInitialGameLoaded, setValue])

  // Update selected game when gameId changes (but not during initial load)
  useEffect(() => {
    if (isInitialGameLoaded && selectedGameId && !selectedGame) {
      // Try to find the game in recent searches or fetch it
      loadGameItems(gameSearchTerm).then((games) => {
        const game = games.find((g) => g.id === selectedGameId)
        if (game) setSelectedGame(game)
      })
    } else if (isInitialGameLoaded && !selectedGameId) {
      setSelectedGame(null)
      setAvailableEmulators([])
      setValue('emulatorId', '') // Clear emulator when game is cleared
    }
  }, [
    selectedGameId,
    selectedGame,
    gameSearchTerm,
    loadGameItems,
    setValue,
    isInitialGameLoaded,
  ])

  // Clear emulator when game changes
  useEffect(() => {
    if (selectedGame) {
      setValue('emulatorId', '') // Clear emulator selection when game changes
      setAvailableEmulators([]) // Clear available emulators
    }
  }, [selectedGame, setValue])

  useEffect(() => {
    if (!customFieldDefinitionsData) return

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
    const dynamicSchema = createDynamicListingSchema(parsed)
    setCurrentSchema(dynamicSchema)
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
  }, [customFieldDefinitionsData, setValue, watch])

  const createListingMutation = api.listings.create.useMutation({
    onSuccess: () => {
      toast.success('Listing successfully submitted for review!')
      router.push('/listings')
    },
    onError: (error) => {
      toast.error(`Error creating listing: ${getErrorMessage(error)}`)
    },
  })

  const onSubmit = (data: ListingFormValues) => {
    // Schema validation handles all validation including custom fields
    createListingMutation.mutate(data)
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
            <GameSelector
              control={control}
              selectedGame={selectedGame}
              errorMessage={String(formState.errors.gameId?.message ?? '')}
              loadGameItems={loadGameItems}
              onGameSelect={setSelectedGame}
              gameSearchTerm={gameSearchTerm}
            />
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
            {formState.errors.deviceId && (
              <p className="text-red-500 text-xs mt-1">
                {String(formState.errors.deviceId.message ?? '')}
              </p>
            )}
          </div>

          {/* Emulator Selection */}
          <div>
            <EmulatorSelector
              control={control}
              selectedGame={selectedGame}
              availableEmulators={availableEmulators}
              emulatorSearchTerm={emulatorSearchTerm}
              emulatorInputFocus={emulatorInputFocus}
              errorMessage={String(formState.errors.emulatorId?.message ?? '')}
              loadEmulatorItems={loadEmulatorItems}
              setValue={setValue}
              onFocus={() => setEmulatorInputFocus(true)}
              onBlur={() => setEmulatorInputFocus(false)}
            />
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
            {formState.errors.performanceId && (
              <p className="text-red-500 text-xs mt-1">
                {String(formState.errors.performanceId.message ?? '')}
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
            {formState.errors.notes && (
              <p className="text-red-500 text-xs mt-1">
                {String(formState.errors.notes.message ?? '')}
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
                {parsedCustomFields.map((fieldDef, index) => (
                  <CustomFieldRenderer
                    key={fieldDef.id}
                    fieldDef={fieldDef}
                    index={index}
                    control={control}
                    errorMessage={
                      formState.errors.customFieldValues?.[index]?.value
                        ?.message &&
                      typeof formState.errors.customFieldValues[index]?.value
                        ?.message === 'string'
                        ? (formState.errors.customFieldValues[index]?.value
                            ?.message as string)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}

          {/* Form Validation Summary */}
          <FormValidationSummary errors={formState.errors} />

          <div className="flex justify-end pt-8">
            <Button
              type="submit"
              variant="primary"
              isLoading={createListingMutation.isPending}
              disabled={
                formState.isSubmitting ?? createListingMutation.isPending
              }
              size="lg"
            >
              {createListingMutation.isPending
                ? 'Creating...'
                : 'Create Listing'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading form...</p>
      </div>
    </div>
  )
}

export default function NewListingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AddListingPage />
    </Suspense>
  )
}
