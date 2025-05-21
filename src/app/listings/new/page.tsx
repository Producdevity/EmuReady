'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { CustomFieldType, type CustomFieldDefinition as PrismaCustomFieldDefinition } from '@orm'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SelectInput from '@/components/ui/SelectInput'

// Zod schema for the main listing form
const listingFormSchema = z.object({
  gameId: z.string().min(1, 'Game is required'),
  deviceId: z.string().min(1, 'Device is required'),
  emulatorId: z.string().min(1, 'Emulator is required'),
  performanceId: z.coerce.number().min(1, 'Performance rating is required'),
  notes: z.string().optional(),
  // Placeholder for custom field values - will be dynamically built
  customFieldValues: z.array(z.object({
    customFieldDefinitionId: z.string(),
    value: z.any(), // Will be refined based on field type
  })).optional(),
})

type ListingFormValues = z.infer<typeof listingFormSchema>

// Interface for CustomFieldDefinition with options parsed if they are JSON
interface CustomFieldOptionUI {
  value: string;
  label: string;
}

interface CustomFieldDefinitionWithOptions extends PrismaCustomFieldDefinition {
  parsedOptions?: CustomFieldOptionUI[];
}

function AddListingPage() {
  const router = useRouter()
  const utils = api.useUtils()

  // --- Form State --- 
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset, // Added reset
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      notes: '',
      customFieldValues: [],
    },
  })

  const selectedEmulatorId = watch('emulatorId')

  // --- Data Fetching --- 
  const { data: gamesData } = api.games.list.useQuery({ limit: 1000, search: '' })
  const { data: devicesData } = api.devices.list.useQuery({ limit: 1000 })
  const { data: emulatorsData } = api.emulators.list.useQuery({})
  const { data: performanceScalesData } = api.listings.performanceScales.useQuery()

  const {
    data: customFieldDefinitionsData,
    isLoading: isLoadingCustomFields,
  } = api.customFieldDefinitions.listByEmulator.useQuery(
    { emulatorId: selectedEmulatorId! }, 
    { enabled: !!selectedEmulatorId }
  )

  const [parsedCustomFields, setParsedCustomFields] = useState<CustomFieldDefinitionWithOptions[]>([])

  useEffect(() => {
    if (customFieldDefinitionsData) {
      const parsed = customFieldDefinitionsData.map((field): CustomFieldDefinitionWithOptions => {
        let parsedOptions: CustomFieldOptionUI[] | undefined = undefined;
        if (field.type === CustomFieldType.SELECT && Array.isArray(field.options)) {
          parsedOptions = field.options.reduce((acc: CustomFieldOptionUI[], opt: unknown) => {
            if (typeof opt === 'object' && opt !== null && 'value' in opt && 'label' in opt) {
              const knownOpt = opt as { value: unknown; label: unknown };
              acc.push({ value: String(knownOpt.value), label: String(knownOpt.label) });
            }
            return acc;
          }, []);
        }
        return { ...field, parsedOptions };
      });
      setParsedCustomFields(parsed);

      // Dynamically update form values for custom fields when they load
      const currentCustomValues = watch('customFieldValues') ?? []
      const newCustomValues = parsed.map(field => {
        const existingValueObj = currentCustomValues.find(cv => cv.customFieldDefinitionId === field.id)
        if (existingValueObj) return existingValueObj
        // Set default based on type
        let defaultValue: string | boolean | number | null
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
            defaultValue = field.parsedOptions?.[0]?.value ?? '' // Default to first option or empty
            break
          default:
            defaultValue = null
        }
        return { customFieldDefinitionId: field.id, value: defaultValue }
      })
      setValue('customFieldValues', newCustomValues)
    }
  }, [customFieldDefinitionsData, setValue, watch, reset])

  // --- Mutation --- 
  const createListingMutation = api.listings.create.useMutation({
    onSuccess: (data) => {
      utils.listings.list.invalidate() // Invalidate list cache
      router.push(`/listings/${data.id}`) // Navigate to the new listing's page
      // TODO: Add success toast/notification
    },
    onError: (error) => {
      console.error("Failed to create listing:", error)
      alert(`Error: ${error.message}`)
      // TODO: Add error toast/notification
    },
  })

  // --- Form Submission --- 
  const onSubmit = (data: ListingFormValues) => {
    // Ensure customFieldValues are correctly formatted, especially for boolean and numbers if stored as strings by form
    const finalCustomFieldValues = data.customFieldValues?.map(cfv => {
      const definition = parsedCustomFields.find(d => d.id === cfv.customFieldDefinitionId)
      let finalValue = cfv.value
      if (definition) {
        if (definition.type === CustomFieldType.BOOLEAN) {
          finalValue = Boolean(cfv.value)
        }
        // Add coercion for numbers if text inputs are used for number types in custom fields (not currently a type)
      }
      return { customFieldDefinitionId: cfv.customFieldDefinitionId, value: finalValue }
    })

    createListingMutation.mutate({ 
      ...data, 
      customFieldValues: finalCustomFieldValues 
    })
  }
  
  // --- Dynamic Custom Field Rendering --- (Helper function)
  const renderCustomField = (fieldDef: CustomFieldDefinitionWithOptions, index: number) => {
    const fieldName = `customFieldValues.${index}.value` as const
    const errorForField = errors.customFieldValues?.[index]?.value
    // For error messages, ensure they are strings
    const errorMessage = typeof errorForField?.message === 'string' ? errorForField.message : undefined

    switch (fieldDef.type) {
      case CustomFieldType.TEXT:
        return (
          <div key={fieldDef.id} className="mb-4">
            <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{fieldDef.label} {fieldDef.isRequired && '*'}</label>
            <Controller
              name={fieldName}
              control={control}
              defaultValue=''
              render={({ field }) => <Input id={fieldName} {...field} className="mt-1 w-full" />}
            />
            {errorMessage && <p className="text-red-500 text-xs mt-1">{errorMessage}</p>}
          </div>
        )
      case CustomFieldType.TEXTAREA:
        return (
          <div key={fieldDef.id} className="mb-4">
            <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{fieldDef.label} {fieldDef.isRequired && '*'}</label>
            <Controller
              name={fieldName}
              control={control}
              defaultValue=''
              render={({ field }) => <textarea id={fieldName} {...field} rows={3} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />}
            />
            {errorMessage && <p className="text-red-500 text-xs mt-1">{errorMessage}</p>}
          </div>
        )
      case CustomFieldType.URL:
        return (
          <div key={fieldDef.id} className="mb-4">
            <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{fieldDef.label} {fieldDef.isRequired && '*'}</label>
            <Controller
              name={fieldName}
              control={control}
              defaultValue=''
              render={({ field }) => <Input id={fieldName} type="url" {...field} className="mt-1 w-full" />}
            />
            {errorMessage && <p className="text-red-500 text-xs mt-1">{errorMessage}</p>}
          </div>
        )
      case CustomFieldType.BOOLEAN:
        return (
          <div key={fieldDef.id} className="mb-4 flex items-center">
            <Controller
              name={fieldName}
              control={control}
              defaultValue={false}
              render={({ field }) => <input id={fieldName} type="checkbox" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />}
            />
            <label htmlFor={fieldName} className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{fieldDef.label} {fieldDef.isRequired && '*'}</label>
            {errorMessage && <p className="text-red-500 text-xs mt-1">{errorMessage}</p>}
          </div>
        )
      case CustomFieldType.SELECT:
        return (
          <div key={fieldDef.id} className="mb-4">
            <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{fieldDef.label} {fieldDef.isRequired && '*'}</label>
            <Controller
              name={fieldName}
              control={control}
              defaultValue={fieldDef.parsedOptions?.[0]?.value ?? ''}
              render={({ field }) => (
                <SelectInput 
                  label={fieldDef.label} // This label prop might be for internal use by SelectInput if it has one
                  options={fieldDef.parsedOptions?.map(opt => ({ id: opt.value, name: opt.label })) ?? []}
                  value={field.value as string}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            {errorMessage && <p className="text-red-500 text-xs mt-1">{errorMessage}</p>}
          </div>
        )
      default:
        return null
    }
  }

  // --- Main Render --- 
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">Create New Listing</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
          {/* Standard Fields */}
          <div>
            <label htmlFor="gameId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Game</label>
            <Controller
              name="gameId"
              control={control}
              render={({ field }) => (
                <SelectInput 
                  label="Game"
                  options={gamesData?.games.map(g => ({ id: g.id, name: g.title })) ?? []} 
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            {errors.gameId && <p className="text-red-500 text-xs mt-1">{String(errors.gameId.message ?? '')}</p>}
          </div>
          
          <div>
            <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Device</label>
            <Controller
              name="deviceId"
              control={control}
              render={({ field }) => (
                <SelectInput 
                  label="Device"
                  options={devicesData?.map(d => ({ id: d.id, name: `${d.brand.name} ${d.modelName}` })) ?? []} 
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            {errors.deviceId && <p className="text-red-500 text-xs mt-1">{String(errors.deviceId.message ?? '')}</p>}
          </div>

          <div>
            <label htmlFor="emulatorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Emulator</label>
            <Controller
              name="emulatorId"
              control={control}
              render={({ field }) => (
                <SelectInput 
                  label="Emulator"
                  options={emulatorsData?.map(e => ({ id: e.id, name: e.name })) ?? []} 
                  value={field.value ?? ''}
                  onChange={(e) => {
                    field.onChange(e.target.value)
                    // Reset custom fields when emulator changes, they will be repopulated by useEffect
                    setValue('customFieldValues', []) 
                  }}
                />
              )}
            />
            {errors.emulatorId && <p className="text-red-500 text-xs mt-1">{String(errors.emulatorId.message ?? '')}</p>}
          </div>

          <div>
            <label htmlFor="performanceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Performance</label>
            <Controller
              name="performanceId"
              control={control}
              render={({ field }) => (
                <SelectInput 
                  label="Performance"
                  options={performanceScalesData?.map(p => ({ id: String(p.id), name: p.label })) ?? []} 
                  value={String(field.value ?? '')} // Ensure value is string for SelectInput
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
            {errors.performanceId && <p className="text-red-500 text-xs mt-1">{String(errors.performanceId.message ?? '')}</p>}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <textarea 
              id="notes" 
              {...register('notes')} 
              rows={4} 
              className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes.message as string}</p>}
          </div>

          {/* Dynamic Custom Fields Section */}
          {selectedEmulatorId && isLoadingCustomFields && <p>Loading custom fields...</p>}
          {selectedEmulatorId && !isLoadingCustomFields && parsedCustomFields.length > 0 && (
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Additional Details (Emulator Specific)</h2>
              {parsedCustomFields.map((fieldDef, index) => renderCustomField(fieldDef, index))}
            </div>
          )}
          
          <div className="flex justify-end pt-6">
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
              Create Listing
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddListingPage
