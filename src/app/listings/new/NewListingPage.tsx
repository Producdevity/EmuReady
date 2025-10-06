'use client'

import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Upload } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import { useForm, Controller } from 'react-hook-form'
import { isString } from 'remeda'
import '@/shared/emulator-config/eden'
import '@/shared/emulator-config/azahar'
import { Button, LoadingSpinner } from '@/components/ui'
import useMounted from '@/hooks/useMounted'
import analytics from '@/lib/analytics'
import { api } from '@/lib/api'
import { useRecaptchaForCreateListing } from '@/lib/captcha/hooks'
import { MarkdownEditor } from '@/lib/dynamic-imports'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
import { type RouterInput } from '@/types/trpc'
import { parseCustomFieldOptions, getCustomFieldDefaultValue } from '@/utils/custom-fields'
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
import { useEmulatorConfigImporter } from './hooks/useEmulatorConfigImporter'
import { reconcileDriverValue } from '../components/shared/custom-fields/driverVersionUtils'

export type ListingFormValues = RouterInput['listings']['create']

function AddListingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mounted = useMounted()
  const utils = api.useUtils()
  const { executeForCreateListing, isCaptchaEnabled } = useRecaptchaForCreateListing()

  const gameIdFromUrl = searchParams.get('gameId')

  const [gameSearchTerm, setGameSearchTerm] = useState('')
  const [emulatorSearchTerm, setEmulatorSearchTerm] = useState('')
  const [deviceSearchTerm, setDeviceSearchTerm] = useState('')
  const [selectedGame, setSelectedGame] = useState<GameOption | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<DeviceOption | null>(null)
  const [availableEmulators, setAvailableEmulators] = useState<EmulatorOption[]>([])
  const [emulatorInputFocus, setEmulatorInputFocus] = useState(false)
  const [parsedCustomFields, setParsedCustomFields] = useState<CustomFieldDefinitionWithOptions[]>(
    [],
  )
  const [isInitialGameLoaded, setIsInitialGameLoaded] = useState(false)
  const [schemaState, setSchemaState] = useState<
    typeof listingFormSchema | ReturnType<typeof createDynamicListingSchema>
  >(listingFormSchema)
  const [highlightedFieldIds, setHighlightedFieldIds] = useState<string[]>([])
  const [importSummary, setImportSummary] = useState<{ filled: number; missing: string[] } | null>(
    null,
  )
  const importHighlightTimeoutRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

  const selectedEmulatorOption = useMemo(() => {
    if (!selectedEmulatorId) return undefined
    return availableEmulators.find((emulator) => emulator.id === selectedEmulatorId)
  }, [availableEmulators, selectedEmulatorId])
  // Prefetch driver versions so an imported Eden driver filename can be resolved immediately
  const driverVersionsQuery = api.listings.driverVersions.useQuery(undefined, {
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  const handleImportResult = useCallback(
    (result: {
      values: { id: string; value: unknown }[]
      missing: string[]
      warnings: string[]
    }) => {
      const currentValues = form.getValues('customFieldValues') ?? []
      const valueMap = new Map(
        currentValues.map((entry) => [entry.customFieldDefinitionId, entry.value]),
      )

      result.values.forEach(({ id, value }) => {
        valueMap.set(id, value)
      })

      // Reconcile Eden driver filename (if present) to canonical driver option value
      {
        const driverField = parsedCustomFields.find((f) => f.name === 'dynamic_driver_version')
        const releases = driverVersionsQuery.data?.releases
        if (driverField && releases) {
          const current = valueMap.get(driverField.id)
          const canonical = reconcileDriverValue(
            typeof current === 'string' ? current : String(current ?? ''),
            releases,
          )
          if (canonical) valueMap.set(driverField.id, canonical)
        }
      }

      const nextValues = parsedCustomFields.map((field) => {
        const explicitValue = valueMap.has(field.id) ? valueMap.get(field.id) : undefined
        const existingValue = currentValues.find(
          (cv) => cv.customFieldDefinitionId === field.id,
        )?.value
        const fallbackValue =
          explicitValue ?? existingValue ?? getCustomFieldDefaultValue(field, field.parsedOptions)

        return {
          customFieldDefinitionId: field.id,
          value: fallbackValue,
        }
      })

      form.setValue('customFieldValues', nextValues, { shouldDirty: true, shouldValidate: true })
      void form.trigger('customFieldValues')

      const changedCount = result.values.reduce((count, entry) => {
        const previousValue = currentValues.find(
          (cv) => cv.customFieldDefinitionId === entry.id,
        )?.value
        return previousValue === entry.value ? count : count + 1
      }, 0)

      const uniqueMissing = Array.from(new Set(result.missing))
      setImportSummary({ filled: changedCount, missing: uniqueMissing })

      setHighlightedFieldIds(result.values.map((entry) => entry.id))
      if (importHighlightTimeoutRef.current) {
        window.clearTimeout(importHighlightTimeoutRef.current)
      }
      importHighlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightedFieldIds([])
      }, 1800)

      if (changedCount > 0) {
        toast.success(
          `Imported Eden configuration. Filled ${changedCount} field${changedCount === 1 ? '' : 's'}.`,
        )
      } else {
        toast.success('Imported Eden configuration.')
      }

      if (uniqueMissing.length > 0) {
        toast.info(`Review manually: ${uniqueMissing.join(', ')}`)
      }

      result.warnings.forEach((warning) => toast.warning(warning))
    },
    [form, parsedCustomFields, driverVersionsQuery.data?.releases],
  )

  // Data fetching for Autocomplete options
  const performanceScalesQuery = api.listings.performanceScales.useQuery()
  const customFieldDefinitionsQuery = api.customFieldDefinitions.getByEmulator.useQuery(
    { emulatorId: selectedEmulatorId },
    {
      enabled: !!selectedEmulatorId && selectedEmulatorId.trim() !== '',
      // Avoid refetching on tab focus which could re-run schema reset logic
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  )

  const normalizedEmulatorName = (
    selectedEmulatorOption?.name ??
    customFieldDefinitionsQuery.data?.[0]?.emulator?.name ??
    ''
  )
    .trim()
    .toLowerCase()

  const importerSlugMap: Record<string, 'eden' | 'azahar'> = {
    eden: 'eden',
    azahar: 'azahar',
  }

  const selectedEmulatorSlug = importerSlugMap[normalizedEmulatorName] ?? null

  const {
    importFile: importEmulatorConfig,
    isImporting: isImportingConfig,
    error: importError,
    supportedFileTypes,
  } = useEmulatorConfigImporter({
    emulatorSlug: selectedEmulatorSlug,
    fields: parsedCustomFields,
    onResult: handleImportResult,
  })

  const handleConfigUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      try {
        await importEmulatorConfig(file)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to import the configuration file. Please try again.'
        toast.error(message)
      } finally {
        event.target.value = ''
      }
    },
    [importEmulatorConfig],
  )

  const showConfigImporter = selectedEmulatorSlug !== null && parsedCustomFields.length > 0
  const supportedExtensions = supportedFileTypes.map((type) => `.${type}`).join(',') || '.ini'
  const supportedExtensionsLabel =
    supportedFileTypes.length === 0
      ? '.ini'
      : supportedFileTypes
          .map((type) => `.${type}`)
          .join(supportedFileTypes.length > 1 ? ' or ' : '')
  const importerDisplayName =
    selectedEmulatorOption?.name ??
    customFieldDefinitionsQuery.data?.[0]?.emulator?.name ??
    (selectedEmulatorSlug
      ? selectedEmulatorSlug.charAt(0).toUpperCase() + selectedEmulatorSlug.slice(1)
      : '')

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
        const result = await utils.games.get.fetch({
          search: query,
          limit: 20,
          listingFilter: 'all',
        })
        return (
          result.games.map((game) => ({
            id: game.id,
            title: game.title,
            system: game.system || {
              id: game.systemId,
              name: 'Unknown',
            },
            status: game.status,
            imageUrl: game.imageUrl ?? undefined,
            boxartUrl: game.boxartUrl ?? undefined,
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
            emulator.systems.some((system) => system.id === selectedGame.system.id),
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

  useEffect(() => {
    return () => {
      if (importHighlightTimeoutRef.current) {
        window.clearTimeout(importHighlightTimeoutRef.current)
      }
    }
  }, [])

  // Handle pre-selected game from URL parameter
  useEffect(() => {
    if (preSelectedGameQuery.data && gameIdFromUrl && !isInitialGameLoaded) {
      const gameOption: GameOption = {
        id: preSelectedGameQuery.data.id,
        title: preSelectedGameQuery.data.title,
        system: preSelectedGameQuery.data.system,
        status: preSelectedGameQuery.data.status,
        imageUrl: preSelectedGameQuery.data.imageUrl ?? undefined,
        boxartUrl: preSelectedGameQuery.data.boxartUrl ?? undefined,
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
  }, [selectedGameId, selectedGame, gameSearchTerm, loadGameItems, form, isInitialGameLoaded])

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
          defaultValue: field.defaultValue as string | number | boolean | null | undefined,
        }
      },
    )

    // If the parsed field definition IDs are unchanged, do not reset the form
    const isSameAsCurrent =
      parsedCustomFields.length === parsed.length &&
      parsedCustomFields.every((f, i) => f.id === parsed[i]?.id)
    if (isSameAsCurrent) return

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

      const defaultValue = getCustomFieldDefaultValue(field, field.parsedOptions)

      return {
        customFieldDefinitionId: field.id,
        value: defaultValue,
      }
    })
    form.setValue('customFieldValues', newCustomValues)
  }, [customFieldDefinitionsQuery.data, form, parsedCustomFields])

  const createListingMutation = api.listings.create.useMutation({
    onSuccess: async (data) => {
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

      // Invalidate queries to refresh data
      await utils.listings.get.invalidate()
      if (data?.gameId) {
        await utils.games.byId.invalidate({ id: data.gameId })
      }

      toast.success('Handheld Report successfully submitted for review!')
      router.push('/listings')
    },
    onError: (error) => {
      toast.error(`Error creating Handheld Report: ${getErrorMessage(error)}`)
    },
  })

  useEffect(() => {
    if (selectedEmulatorSlug !== 'eden') {
      setImportSummary(null)
      setHighlightedFieldIds([])
    }
  }, [selectedEmulatorSlug])

  const onSubmit = async (data: ListingFormValues) => {
    if (!currentUserQuery.data?.id) {
      return toast.error('You must be signed in to create a Compatibility Report.')
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

  // Show loading state while authentication is being checked
  if (currentUserQuery.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!currentUserQuery.data?.id) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Who this?</h1>
          <p className="text-gray-600 mb-6">Please sign in to create a new listing.</p>

          <div className="mt-4">
            <SignInButton mode="modal">
              <p className="p-3 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                <span className="block text-gray-900 dark:text-white font-medium">Login</span>
              </p>
            </SignInButton>

            <SignUpButton mode="modal">
              <p className="p-3 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                <span className="block text-gray-900 dark:text-white font-medium">Sign Up</span>
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
          Create a Handheld Compatibility Report
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
            {!selectedGame && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Can&apos;t find your game?{' '}
                <Link
                  href="/games/new/search/v2"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                >
                  Add it here
                </Link>
              </div>
            )}
          </div>

          {/* Device Selection */}
          <div>
            <DeviceSelector<ListingFormValues>
              control={form.control}
              name="deviceId"
              selectedDevice={selectedDevice}
              errorMessage={form.formState.errors.deviceId?.message}
              loadDeviceItems={loadDeviceItems}
              onDeviceSelect={(device: DeviceOption | null) => setSelectedDevice(device)}
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
                {showConfigImporter && (
                  <div className="mb-6">
                    <label
                      htmlFor="eden-config-upload"
                      className={cn(
                        'group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-emerald-400/60 bg-emerald-500/10 p-6 text-center transition focus-within:ring-2 focus-within:ring-emerald-400 hover:border-emerald-400 hover:bg-emerald-500/15 sm:flex-row sm:gap-4 sm:text-left',
                        isImportingConfig && 'cursor-progress opacity-80',
                      )}
                    >
                      <input
                        ref={fileInputRef}
                        id="eden-config-upload"
                        type="file"
                        accept={supportedExtensions}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        onChange={handleConfigUpload}
                      />
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform duration-200 group-hover:scale-105">
                        {isImportingConfig ? (
                          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Upload className="h-5 w-5" aria-hidden="true" />
                        )}
                      </div>
                      <div className="mt-4 sm:mt-0 sm:text-left">
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-200">
                          Import {importerDisplayName} config ({supportedExtensionsLabel})
                        </p>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                          We’ll auto-fill matching fields from your {importerDisplayName}{' '}
                          configuration file.
                        </p>
                      </div>
                    </label>
                    {importError && (
                      <p className="mt-2 text-sm text-red-500 dark:text-red-400">{importError}</p>
                    )}
                    {importSummary && (
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                        Filled {importSummary.filled} field{importSummary.filled === 1 ? '' : 's'}.
                        {importSummary.missing.length > 0 && (
                          <> Missing: {importSummary.missing.join(', ')}.</>
                        )}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {parsedCustomFields.map((fieldDef, index) => {
                    const errorMessage = isString(
                      form.formState.errors.customFieldValues?.[index]?.value?.message,
                    )
                      ? form.formState.errors.customFieldValues?.[index]?.value?.message
                      : undefined
                    const isHighlighted = highlightedFieldIds.includes(fieldDef.id)

                    return (
                      <div
                        key={fieldDef.id}
                        className={cn(
                          'rounded-2xl border border-gray-200/60 p-4 shadow-sm transition dark:border-gray-700/60',
                          isHighlighted &&
                            'border-emerald-400/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/20',
                        )}
                      >
                        <CustomFieldRenderer
                          fieldDef={fieldDef}
                          fieldName={`customFieldValues.${index}.value` as const}
                          index={index}
                          control={form.control}
                          errorMessage={errorMessage}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          {/* Form Validation Summary */}
          <FormValidationSummary errors={form.formState.errors} />

          <div className="flex justify-end pt-8">
            <Button
              type="submit"
              variant="primary"
              isLoading={createListingMutation.isPending}
              disabled={form.formState.isSubmitting ?? createListingMutation.isPending}
              size="lg"
            >
              Create Compatibility Report
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
