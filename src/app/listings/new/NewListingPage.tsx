'use client'

import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type KeyboardEvent,
} from 'react'
import { useForm, Controller } from 'react-hook-form'
import { isString } from 'remeda'
import { Button, LoadingSpinner } from '@/components/ui'
import useMounted from '@/hooks/useMounted'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { useRecaptchaForCreateListing } from '@/lib/captcha/hooks'
import { MarkdownEditor } from '@/lib/dynamic-imports'
import toast from '@/lib/toast'
import { type RouterInput } from '@/types/trpc'
import {
  parseCustomFieldOptions,
  getCustomFieldDefaultValue,
} from '@/utils/customFields'
import getErrorMessage from '@/utils/getErrorMessage'
import {
  CustomFieldRenderer,
  type DeviceOption,
  DeviceSelector,
  type EmulatorOption,
  EmulatorSelector,
  type GameOption,
  GameSelector,
  PerformanceSelector,
  FormValidationSummary,
} from '../components/shared'
import createDynamicListingSchema, {
  type CustomFieldDefinitionWithOptions,
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
  const [availableEmulators, setAvailableEmulators] = useState<
    EmulatorOption[]
  >([])
  const [emulatorInputFocus, setEmulatorInputFocus] = useState(false)
  const [parsedCustomFields, setParsedCustomFields] = useState<
    CustomFieldDefinitionWithOptions[]
  >([])
  const [isInitialGameLoaded, setIsInitialGameLoaded] = useState(false)
  const [schemaState, setSchemaState] = useState<
    typeof listingFormSchema | ReturnType<typeof createDynamicListingSchema>
  >(listingFormSchema)

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(schemaState),
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
            system: game.system || {
              id: game.systemId,
              name: 'Unknown',
            },
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
    const dynamicSchema = createDynamicListingSchema(parsed)
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

  const createListingMutation = api.listings.create.useMutation({
    onSuccess: (data) => {
      analytics.listing.created({
        listingId: data?.id,
        gameId: data?.gameId,
        systemId: selectedGame?.system.id,
        emulatorId: data?.emulatorId,
        deviceId: data?.deviceId,
        performanceId: data?.performanceId,
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
    if (!currentUserQuery.data?.id) {
      return toast.error('Yu must be signed in to create a listing.')
    }

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
          Create New Listing
        </h1>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          onKeyDown={handleKeyDown}
          className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl"
        >
          {/* Game Selection */}
          <div>
            <GameSelector<ListingFormValues>
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

          {/* Device Selection */}
          <div>
            <DeviceSelector<ListingFormValues>
              control={form.control}
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
            <EmulatorSelector<ListingFormValues>
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

          {/* Performance Selection */}
          <div>
            <PerformanceSelector<ListingFormValues>
              control={form.control}
              name="performanceId"
              performanceScalesData={performanceScalesQuery.data}
              errorMessage={form.formState.errors.performanceId?.message}
            />
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
