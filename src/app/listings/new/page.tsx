'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import {
  type Control,
  type FieldValues,
  useForm,
  type UseFormSetValue,
} from 'react-hook-form'
import { isString } from 'remeda'
import { type z } from 'zod'
import { Button, Input, LoadingSpinner } from '@/components/ui'
import useMounted from '@/hooks/useMounted'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { useRecaptchaForCreateListing } from '@/lib/captcha/hooks'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import getErrorMessage from '@/utils/getErrorMessage'
import { CustomFieldType } from '@orm'
import {
  CustomFieldRenderer,
  type DeviceOption,
  DeviceSelector,
  type EmulatorOption,
  EmulatorSelector,
  FormValidationSummary,
  type GameOption,
  GameSelector,
  PerformanceSelector,
} from '../components/shared'
import createDynamicListingSchema, {
  type CustomFieldDefinitionWithOptions,
  type CustomFieldOptionUI,
} from './form-schemas/createDynamicListingSchema'
import listingFormSchema from './form-schemas/listingFormSchema'

export type ListingFormValues = RouterInput['listings']['create']

function AddListingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mounted = useMounted()
  const utils = api.useUtils()
  const { executeForCreateListing, isCaptchaEnabled } =
    useRecaptchaForCreateListing()

  const gameIdFromUrl = searchParams.get('gameId')

  const [gameSearchTerm, setGameSearchTerm] = useState('')
  const [emulatorSearchTerm, setEmulatorSearchTerm] = useState('')
  const [deviceSearchTerm, setDeviceSearchTerm] = useState('')
  const [selectedGame, setSelectedGame] = useState<GameOption | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<DeviceOption | null>(
    null,
  )
  const [availableEmulators] = useState<EmulatorOption[]>([])
  const [emulatorInputFocus, setEmulatorInputFocus] = useState(false)
  const [parsedCustomFields, setParsedCustomFields] = useState<
    CustomFieldDefinitionWithOptions[]
  >([])
  const [isInitialGameLoaded, setIsInitialGameLoaded] = useState(false)

  const [currentSchema, setCurrentSchema] =
    useState<z.ZodType<ListingFormValues>>(listingFormSchema)

  const form = useForm<ListingFormValues>({
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

  const selectedEmulatorId = form.watch('emulatorId')
  const selectedGameId = form.watch('gameId')

  // Data fetching for Autocomplete options
  const performanceScalesQuery = api.listings.performanceScales.useQuery()
  const customFieldDefinitionsQuery =
    api.customFieldDefinitions.getByEmulator.useQuery(
      { emulatorId: selectedEmulatorId! },
      { enabled: !!selectedEmulatorId },
    )

  const currentUserQuery = api.users.me.useQuery()

  // Fetch game data if gameId is provided in URL
  const preSelectedGameQuery = api.games.byId.useQuery(
    { id: gameIdFromUrl! },
    { enabled: !!gameIdFromUrl && !isInitialGameLoaded },
  )

  // Individual load functions - cleaner than grouping them in an interface
  const loadGameItems = useCallback(
    async (query: string): Promise<GameOption[]> => {
      setGameSearchTerm(query)
      if (query.length < 2) return Promise.resolve([])
      try {
        const result = await utils.games.get.fetch({ search: query, limit: 20 })
        return (
          result.games.map((game) => ({
            id: game.id,
            title: game.title,
            system: game.system,
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

  const loadEmulatorItems = useCallback(
    async (query: string): Promise<EmulatorOption[]> => {
      setEmulatorSearchTerm(query)

      if (!selectedGame) return Promise.resolve([])

      try {
        const result = await utils.emulators.get.fetch({ search: query })

        // Filter to only emulators that support the selected game's system
        return result.emulators
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
      } catch (error) {
        console.error('Error fetching emulators:', error)
        return []
      }
    },
    [utils.emulators.get, selectedGame],
  )

  const loadDeviceItems = useCallback(
    async (query: string): Promise<DeviceOption[]> => {
      setDeviceSearchTerm(query)
      if (query.length < 2) return Promise.resolve([])
      try {
        const result = await utils.devices.get.fetch({
          search: query,
          limit: 50,
        })
        const devices = result.devices || []
        return devices
          .filter((device) => device.soc !== null) // Filter out devices without SoCs
          .map((device) => ({
            id: device.id,
            modelName: device.modelName,
            brand: {
              id: device.brand.id,
              name: device.brand.name,
            },
            soc: {
              id: device.soc!.id,
              name: device.soc!.name,
              manufacturer: device.soc!.manufacturer,
            },
          }))
      } catch (error) {
        console.error('Error fetching devices:', error)
        return []
      }
    },
    [utils.devices.get],
  )

  // Handle pre-selected game from URL parameter
  useEffect(() => {
    if (preSelectedGameQuery.data && gameIdFromUrl && !isInitialGameLoaded) {
      const gameOption: GameOption = {
        id: preSelectedGameQuery.data.id,
        title: preSelectedGameQuery.data.title,
        system: preSelectedGameQuery.data.system,
        status: preSelectedGameQuery.data.status,
      }
      setSelectedGame(gameOption)
      form.setValue('gameId', preSelectedGameQuery.data.id)
      setIsInitialGameLoaded(true)

      // Set the game search term to help with the autocomplete display
      setGameSearchTerm(preSelectedGameQuery.data.title)
    }
  }, [preSelectedGameQuery.data, gameIdFromUrl, isInitialGameLoaded, form])

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
      form.setValue('emulatorId', '') // Clear emulator when game is cleared
    }
  }, [
    selectedGameId,
    selectedGame,
    gameSearchTerm,
    loadGameItems,
    form,
    isInitialGameLoaded,
  ])

  // Clear emulator when game changes
  useEffect(() => {
    if (selectedGame) {
      form.setValue('emulatorId', '') // Clear emulator selection when game changes
    }
  }, [selectedGame, form])

  useEffect(() => {
    if (!customFieldDefinitionsQuery.data) return

    const parsed = customFieldDefinitionsQuery.data.map(
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
    const dynamicSchema = createDynamicListingSchema(parsed)
    setCurrentSchema(dynamicSchema)
    const currentCustomValues = form.watch('customFieldValues') ?? []
    const newCustomValues = parsed.map((field) => {
      const existingValueObj = currentCustomValues.find(
        (cv) => cv.customFieldDefinitionId === field.id,
      )
      if (existingValueObj) return existingValueObj

      // Use the actual default value from the field definition
      let defaultValue: string | boolean | number | null | undefined =
        field.defaultValue as string | boolean | number | null | undefined

      // Only fall back to hardcoded defaults if no default value is set
      if (defaultValue === null || defaultValue === undefined) {
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
      }

      return {
        customFieldDefinitionId: field.id,
        value: defaultValue,
      }
    })
    form.setValue('customFieldValues', newCustomValues)
  }, [customFieldDefinitionsQuery.data, form])

  const createListingMutation = api.listings.create.useMutation({
    onSuccess: (data) => {
      analytics.listing.created({
        listingId: data.id,
        gameId: data.gameId,
        systemId: selectedGame?.system.id || 'unknown',
        emulatorId: data.emulatorId,
        deviceId: data.deviceId,
        performanceId: data.performanceId,
      })

      if (currentUserQuery.data?.id) {
        analytics.conversion.goalCompleted({
          userId: currentUserQuery.data.id,
          goalType: 'listing_created',
          goalValue: 1,
        })
      }

      toast.success('Listing successfully submitted for review!')
      router.push('/listings')
    },
    onError: (error) => {
      toast.error(`Error creating listing: ${getErrorMessage(error)}`)
    },
  })

  const onSubmit = async (data: ListingFormValues) => {
    // Get CAPTCHA token if enabled
    let recaptchaToken: string | null = null
    if (isCaptchaEnabled) {
      recaptchaToken = await executeForCreateListing()
    }

    // Schema validation handles all validation including custom fields
    createListingMutation.mutate({
      ...data,
      ...(recaptchaToken && { recaptchaToken }),
    })
  }

  // Prevent form submission on Enter key press
  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter' && event.target instanceof HTMLElement) {
      // Allow Enter key in textareas for line breaks
      if (event.target.tagName.toLowerCase() === 'textarea') {
        return
      }
      // Prevent form submission for all other elements
      event.preventDefault()
    }
  }

  if (!mounted) return null

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full md:max-w-3xl lg:mx-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Create New Listing
        </h1>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onKeyDown={handleKeyDown}
          className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl"
        >
          {/* Game Selection */}
          <div>
            <GameSelector
              control={form.control as unknown as Control<FieldValues>}
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

          {/* Device Selection */}
          <div>
            <DeviceSelector
              control={form.control as unknown as Control<FieldValues>}
              name="deviceId"
              selectedDevice={selectedDevice}
              errorMessage={form.formState.errors.deviceId?.message}
              loadDeviceItems={loadDeviceItems}
              onDeviceSelect={(device: DeviceOption | null) =>
                setSelectedDevice(device)
              }
              deviceSearchTerm={deviceSearchTerm}
            />
          </div>

          {/* Emulator Selection */}
          <div>
            <EmulatorSelector
              control={form.control as unknown as Control<FieldValues>}
              name="emulatorId"
              selectedGame={selectedGame}
              availableEmulators={availableEmulators}
              emulatorSearchTerm={emulatorSearchTerm}
              emulatorInputFocus={emulatorInputFocus}
              errorMessage={form.formState.errors.emulatorId?.message}
              loadEmulatorItems={loadEmulatorItems}
              setValue={
                form.setValue as unknown as UseFormSetValue<FieldValues>
              }
              onFocus={() => setEmulatorInputFocus(true)}
              onBlur={() => setEmulatorInputFocus(false)}
              customFieldValuesFieldName="customFieldValues"
            />
          </div>

          {/* Performance Selection */}
          <div>
            <PerformanceSelector
              control={form.control as unknown as Control<FieldValues>}
              name="performanceId"
              performanceScalesData={performanceScalesQuery.data}
              errorMessage={form.formState.errors.performanceId?.message}
            />
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
              {...form.register('notes')}
              leftIcon={<FileText className="w-5 h-5" />}
              rows={4}
              className="mt-1 w-full"
              placeholder="Share your experience, settings, or any additional details..."
            />
            {form.formState.errors.notes && (
              <p className="text-red-500 text-xs mt-1">
                {String(form.formState.errors.notes.message ?? '')}
              </p>
            )}
          </div>

          {/* Dynamic Custom Fields Section */}
          {selectedEmulatorId && customFieldDefinitionsQuery.isLoading && (
            <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                Loading emulator-specific fields...
              </p>
            </div>
          )}
          {selectedEmulatorId &&
            !customFieldDefinitionsQuery.isLoading &&
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
                      control={form.control as unknown as Control<FieldValues>}
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
              isLoading={createListingMutation.isPending}
              disabled={
                form.formState.isSubmitting ?? createListingMutation.isPending
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

function NewListingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-96">
          <LoadingSpinner />
        </div>
      }
    >
      <AddListingPage />
    </Suspense>
  )
}

export default NewListingPage
