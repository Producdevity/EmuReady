'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
} from 'lucide-react'
import toast from '@/lib/toast'

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
}

interface EmulatorOption extends AutocompleteOptionBase {
  id: string
  name: string
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
  const utils = api.useUtils()

  const [gameSearchTerm, setGameSearchTerm] = useState('')
  const [emulatorSearchTerm, setEmulatorSearchTerm] = useState('')

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

  // Data fetching for Autocomplete options - these are not directly used in Autocomplete props anymore
  // They serve to make `utils.games.list.fetch` and `utils.emulators.list.fetch` available.
  // The `isLoading` states from these might be useful for global loading indicators if desired.
  api.games.list.useQuery(
    { search: gameSearchTerm, limit: 20 },
    { enabled: false },
  )
  api.emulators.list.useQuery(
    { search: emulatorSearchTerm },
    { enabled: false },
  )

  const { data: devicesData } = api.devices.list.useQuery({ limit: 1000 })
  const { data: performanceScalesData } =
    api.listings.performanceScales.useQuery()
  const { data: customFieldDefinitionsData, isLoading: isLoadingCustomFields } =
    api.customFieldDefinitions.listByEmulator.useQuery(
      { emulatorId: selectedEmulatorId! },
      { enabled: !!selectedEmulatorId },
    )
  const [parsedCustomFields, setParsedCustomFields] = useState<
    CustomFieldDefinitionWithOptions[]
  >([])

  // Autocomplete loadItems functions
  const loadGameItems = useCallback(
    async (query: string): Promise<GameOption[]> => {
      setGameSearchTerm(query)
      if (query.length < 2) return Promise.resolve([])
      try {
        const result = await utils.games.list.fetch({
          search: query,
          limit: 20,
        })
        return result.games.map((g) => ({ id: g.id, title: g.title })) ?? []
      } catch (error) {
        console.error('Error fetching games:', error)
        return []
      }
    },
    [utils.games.list],
  )

  const loadEmulatorItems = useCallback(
    async (query: string): Promise<EmulatorOption[]> => {
      setEmulatorSearchTerm(query)
      if (query.length < 1) return Promise.resolve([])
      try {
        const result = await utils.emulators.list.fetch({ search: query })
        return result.map((e) => ({ id: e.id, name: e.name })) ?? []
      } catch (error) {
        console.error('Error fetching emulators:', error)
        return []
      }
    },
    [utils.emulators.list],
  )

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
          case CustomFieldType.TEXT:
          case CustomFieldType.TEXTAREA:
          case CustomFieldType.URL:
            defaultValue = ''
            break
          case CustomFieldType.SELECT:
            defaultValue = field.parsedOptions?.[0]?.value ?? ''
            break
          default:
            defaultValue = undefined
        }
        return { customFieldDefinitionId: field.id, value: defaultValue }
      })
      setValue(
        'customFieldValues',
        newCustomValues.filter((cv) => cv.value !== undefined),
        { shouldValidate: false, shouldDirty: false },
      )
    }
  }, [customFieldDefinitionsData, setValue, watch])

  const createListingMutation = api.listings.create.useMutation({
    onSuccess: (data) => {
      utils.listings.get.invalidate()
      router.push(`/listings/${data.id}`)
      toast.success('Listing created successfully!')
    },
    onError: (error) => {
      console.error('Failed to create listing:', error)
      toast.error(`Failed to create listing: ${error.message}`)
    },
  })

  const onSubmit = (data: ListingFormValues) => {
    // Ensure customFieldValues are correctly formatted, especially for boolean and numbers if stored as strings by form
    const finalCustomFieldValues = data.customFieldValues?.map((cfv) => {
      const definition = parsedCustomFields.find(
        (d) => d.id === cfv.customFieldDefinitionId,
      )
      let finalValue = cfv.value
      if (definition) {
        if (definition.type === CustomFieldType.BOOLEAN) {
          finalValue = Boolean(cfv.value)
        }
        // Add coercion for numbers if text inputs are used for number types in custom fields (not currently a type)
      }
      return {
        customFieldDefinitionId: cfv.customFieldDefinitionId,
        value: finalValue,
      }
    })

    createListingMutation.mutate({
      ...data,
      customFieldValues: finalCustomFieldValues,
    })
  }

  const renderCustomField = (
    fieldDef: CustomFieldDefinitionWithOptions,
    index: number,
  ) => {
    const fieldName = `customFieldValues.${index}.value` as const
    const errorForField = errors.customFieldValues?.[index]?.value
    // For error messages, ensure they are strings
    const errorMessage =
      typeof errorForField?.message === 'string'
        ? errorForField.message
        : undefined
    let icon = null
    switch (fieldDef.type) {
      case CustomFieldType.TEXT:
        icon = <CaseSensitive className="w-5 h-5" />
        break
      case CustomFieldType.TEXTAREA:
        icon = <FileText className="w-5 h-5" />
        break
      case CustomFieldType.URL:
        icon = <LinkIcon className="w-5 h-5" />
        break
      case CustomFieldType.BOOLEAN:
        icon = <CheckSquare className="w-5 h-5" />
        break
      case CustomFieldType.SELECT:
        icon = <ListChecks className="w-5 h-5" />
        break
    }

    switch (fieldDef.type) {
      case CustomFieldType.TEXT:
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
                  id={fieldName}
                  {...field}
                  leftIcon={icon}
                  className="mt-1 w-full"
                />
              )}
            />
            {errorMessage && (
              <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
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
                  {...field}
                  leftIcon={icon}
                  rows={3}
                  className="mt-1 w-full"
                />
              )}
            />
            {errorMessage && (
              <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
            )}
          </div>
        )
      case CustomFieldType.URL:
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
                  id={fieldName}
                  type="url"
                  {...field}
                  leftIcon={icon}
                  className="mt-1 w-full"
                />
              )}
            />
            {errorMessage && (
              <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
            )}
          </div>
        )
      case CustomFieldType.BOOLEAN:
        return (
          <div key={fieldDef.id} className="mb-4 flex items-center pt-2">
            {icon && <span className="mr-2 text-gray-500">{icon}</span>}
            <Controller
              name={fieldName}
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <input
                  id={fieldName}
                  type="checkbox"
                  checked={
                    typeof field.value === 'boolean'
                      ? field.value
                      : !!field.value
                  }
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              )}
            />
            <label
              htmlFor={fieldName}
              className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {fieldDef.label} {fieldDef.isRequired && '*'}
            </label>
            {errorMessage && (
              <p className="text-red-500 text-xs mt-1 ml-6">{errorMessage}</p>
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
            {errorMessage && (
              <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
            )}
          </div>
        )
      default:
        return null
    }
  }

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
          {/* Standard Fields */}
          <div>
            <label
              htmlFor="gameId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Game
            </label>
            <Controller
              name="gameId"
              control={control}
              render={({ field }) => (
                <Autocomplete<GameOption>
                  label="Game"
                  leftIcon={<Puzzle className="w-5 h-5" />}
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  loadItems={loadGameItems}
                  optionToValue={(item) => item.id}
                  optionToLabel={(item) => item.title}
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
          </div>

          <div>
            <label
              htmlFor="deviceId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Device
            </label>
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

          <div>
            <label
              htmlFor="emulatorId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Emulator
            </label>
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
                    setValue('customFieldValues', [])
                  }}
                  loadItems={loadEmulatorItems}
                  optionToValue={(item) => item.id}
                  optionToLabel={(item) => item.name}
                  placeholder="Search for an emulator..."
                  minCharsToTrigger={1}
                />
              )}
            />
            {errors.emulatorId && (
              <p className="text-red-500 text-xs mt-1">
                {String(errors.emulatorId.message ?? '')}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="performanceId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Performance
            </label>
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
          </div>

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
            />
            {errors.notes && (
              <p className="text-red-500 text-xs mt-1">
                {String(errors.notes.message ?? '')}
              </p>
            )}
          </div>

          {/* Dynamic Custom Fields Section */}
          {selectedEmulatorId && isLoadingCustomFields && (
            <p className="text-center py-4">Loading custom fields...</p>
          )}
          {selectedEmulatorId &&
            !isLoadingCustomFields &&
            parsedCustomFields.length > 0 && (
              <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                  Additional Details (
                  {customFieldDefinitionsData?.find(
                    (e) => e.emulatorId === selectedEmulatorId,
                  )?.emulator.name ?? 'Selected Emulator'}
                  )
                </h2>
                {parsedCustomFields.map((fieldDef, index) =>
                  renderCustomField(fieldDef, index),
                )}
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
