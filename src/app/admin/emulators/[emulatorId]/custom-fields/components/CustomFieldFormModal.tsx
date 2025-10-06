'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { toSnakeCase } from 'remeda'
import { z } from 'zod'
import {
  Button,
  Input,
  SelectInput,
  RangeFieldConfig,
  SelectFieldOptions,
  DefaultValueSelector,
  FIELD_TYPE_OPTIONS,
} from '@/components/ui'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import getErrorMessage from '@/utils/getErrorMessage'
import { CustomFieldType } from '@orm'

const customFieldOptionSchema = z.object({
  value: z.string().min(1, 'Value is required'),
  label: z.string().min(1, 'Label is required'),
})

const customFieldFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Internal Name is required')
    .regex(/^[a-z0-9_]+$/, {
      message: 'Name must be lowercase alphanumeric with underscores only.',
    }),
  label: z.string().min(1, 'Label is required'),
  type: z.nativeEnum(CustomFieldType),
  categoryId: z.string().uuid().nullable().optional(),
  categoryOrder: z.coerce.number().int().optional(),
  options: z.array(customFieldOptionSchema).optional(),
  defaultValue: z.union([z.string(), z.boolean(), z.number(), z.null()]).optional(),
  placeholder: z.string().optional(),
  // Range-specific fields
  rangeMin: z.coerce.number().optional(),
  rangeMax: z.coerce.number().optional(),
  rangeUnit: z.string().optional(),
  rangeDecimals: z.coerce.number().int().min(0).max(5).optional(),
  isRequired: z.boolean().optional(),
  displayOrder: z.coerce.number().int().optional(),
})

type CustomFieldFormValues = z.infer<typeof customFieldFormSchema>

interface Props {
  emulatorId: string
  fieldIdToEdit?: string | null
  isOpen: boolean
  onClose: () => void
}

function CustomFieldFormModal(props: Props) {
  const utils = api.useUtils()
  const userHasEditedNameRef = useRef(false)

  const customFieldDefinitionsQuery = api.customFieldDefinitions.byId.useQuery(
    { id: props.fieldIdToEdit! },
    { enabled: !!props.fieldIdToEdit },
  )

  const categoriesQuery = api.customFieldCategories.getByEmulator.useQuery(
    { emulatorId: props.emulatorId },
    { enabled: !!props.emulatorId },
  )

  const { control, register, handleSubmit, reset, watch, setValue, formState } =
    useForm<CustomFieldFormValues>({
      resolver: zodResolver(customFieldFormSchema),
      defaultValues: {
        name: '',
        label: '',
        type: CustomFieldType.TEXT,
        categoryId: null,
        categoryOrder: 0,
        options: [],
        defaultValue: null,
        placeholder: '',
        rangeMin: 0,
        rangeMax: 100,
        rangeUnit: '',
        rangeDecimals: 0,
        isRequired: false,
        displayOrder: 0,
      },
    })

  const selectedFieldType = watch('type')
  const watchedLabel = watch('label')
  const { fields, append, remove, update } = useFieldArray({ control, name: 'options' })

  // Autopopulate field name from label
  useEffect(() => {
    if (!userHasEditedNameRef.current && watchedLabel && !props.fieldIdToEdit) {
      const snakeCaseName = toSnakeCase(watchedLabel)
      setValue('name', snakeCaseName)
    }
  }, [watchedLabel, props.fieldIdToEdit, setValue])

  useEffect(() => {
    if (customFieldDefinitionsQuery.data) {
      const opts = Array.isArray(customFieldDefinitionsQuery.data.options)
        ? (customFieldDefinitionsQuery.data.options as {
            value: string
            label: string
          }[])
        : []
      reset({
        name: customFieldDefinitionsQuery.data.name,
        label: customFieldDefinitionsQuery.data.label,
        type: customFieldDefinitionsQuery.data.type,
        categoryId: customFieldDefinitionsQuery.data.categoryId || null,
        categoryOrder: customFieldDefinitionsQuery.data.categoryOrder || 0,
        options: opts,
        defaultValue: customFieldDefinitionsQuery.data.defaultValue as
          | string
          | boolean
          | number
          | null,
        placeholder: customFieldDefinitionsQuery.data.placeholder || '',
        rangeMin: customFieldDefinitionsQuery.data.rangeMin || 0,
        rangeMax: customFieldDefinitionsQuery.data.rangeMax || 100,
        rangeUnit: customFieldDefinitionsQuery.data.rangeUnit || '',
        rangeDecimals: customFieldDefinitionsQuery.data.rangeDecimals || 0,
        isRequired: customFieldDefinitionsQuery.data.isRequired,
        displayOrder: customFieldDefinitionsQuery.data.displayOrder,
      })
      userHasEditedNameRef.current = true // Don't auto-populate when editing
    } else if (!props.fieldIdToEdit) {
      reset({
        name: '',
        label: '',
        type: CustomFieldType.TEXT,
        categoryId: null,
        categoryOrder: 0,
        options: [],
        defaultValue: null,
        placeholder: '',
        rangeMin: 0,
        rangeMax: 100,
        rangeUnit: '',
        rangeDecimals: 0,
        isRequired: false,
        displayOrder: 0,
      })
      userHasEditedNameRef.current = false
    }
  }, [customFieldDefinitionsQuery.data, props.fieldIdToEdit, reset])

  const createMutation = api.customFieldDefinitions.create.useMutation({
    onSuccess: () => {
      utils.customFieldDefinitions.getByEmulator
        .invalidate({ emulatorId: props.emulatorId })
        .catch(console.error)
      props.onClose()
      toast.success('Custom field created successfully')
    },
    onError: (error) => {
      console.error('Error creating custom field:', error)
      toast.error(`Failed to create custom field: ${getErrorMessage(error.message)}`)
    },
  })

  const updateMutation = api.customFieldDefinitions.update.useMutation({
    onSuccess: () => {
      utils.customFieldDefinitions.getByEmulator
        .invalidate({ emulatorId: props.emulatorId })
        .catch(console.error)
      if (props.fieldIdToEdit) {
        utils.customFieldDefinitions.byId
          .invalidate({ id: props.fieldIdToEdit })
          .catch(console.error)
      }
      props.onClose()
      toast.success('Custom field updated successfully')
    },
    onError: (error) => {
      console.error('Error updating custom field:', error)
      toast.error(`Failed to update custom field: ${getErrorMessage(error.message)}`)
    },
  })

  const onSubmit = (data: CustomFieldFormValues) => {
    const basePayload = {
      name: data.name,
      label: data.label,
      type: data.type,
      categoryId: data.categoryId || null,
      categoryOrder: data.categoryOrder ?? 0,
      isRequired: data.isRequired ?? false,
      displayOrder: data.displayOrder ?? 0,
      options: undefined as { value: string; label: string }[] | undefined,
      defaultValue:
        data.defaultValue === null || data.defaultValue === undefined
          ? undefined
          : data.defaultValue,
      placeholder:
        data.placeholder === null || data.placeholder === undefined || data.placeholder === ''
          ? undefined
          : data.placeholder,
      rangeMin: undefined as number | undefined,
      rangeMax: undefined as number | undefined,
      rangeUnit: undefined as string | undefined,
      rangeDecimals: undefined as number | undefined,
    }

    // Handle SELECT-specific data
    if (data.type === CustomFieldType.SELECT && data.options && data.options.length > 0) {
      basePayload.options = data.options.filter((opt) => opt.value && opt.label)
    }

    // Handle RANGE-specific data
    if (data.type === CustomFieldType.RANGE) {
      basePayload.rangeMin = data.rangeMin ?? 0
      basePayload.rangeMax = data.rangeMax ?? 100
      basePayload.rangeUnit = data.rangeUnit || undefined
      basePayload.rangeDecimals = data.rangeDecimals ?? 0

      // Validate default value is within range
      if (typeof data.defaultValue === 'number') {
        const min = basePayload.rangeMin
        const max = basePayload.rangeMax
        if (data.defaultValue < min || data.defaultValue > max) {
          toast.error(`Default value must be between ${min} and ${max}`)
          return
        }
      }
    }

    if (props.fieldIdToEdit) {
      const payload: { id: string } & typeof basePayload = {
        id: props.fieldIdToEdit,
        ...basePayload,
      }
      updateMutation.mutate(payload)
    } else {
      const payload: { emulatorId: string } & typeof basePayload = {
        emulatorId: props.emulatorId,
        ...basePayload,
      }
      createMutation.mutate(payload)
    }
  }

  const handleRangeChange = (field: string, value: string | number | null) => {
    if (field === 'defaultValue' && selectedFieldType === CustomFieldType.RANGE) {
      setValue('defaultValue', value as number | null)
    } else {
      setValue(field as keyof CustomFieldFormValues, value as never)
    }
  }

  const handleUpdateOption = (index: number, field: 'value' | 'label', value: string) => {
    const currentOption = fields[index]
    if (currentOption) update(index, { ...currentOption, [field]: value })
  }

  if (!props.isOpen) return null

  const typeOptions = FIELD_TYPE_OPTIONS.map((type) => ({
    id: type.value,
    name: type.label,
  }))

  // Build error objects for shared components
  const rangeErrors: { [key: string]: string } = {}
  if (formState.errors.rangeMin) rangeErrors.rangeMin = formState.errors.rangeMin.message!
  if (formState.errors.rangeMax) rangeErrors.rangeMax = formState.errors.rangeMax.message!
  if (formState.errors.rangeUnit) rangeErrors.rangeUnit = formState.errors.rangeUnit.message!
  if (formState.errors.rangeDecimals)
    rangeErrors.rangeDecimals = formState.errors.rangeDecimals.message!
  if (formState.errors.defaultValue && selectedFieldType === CustomFieldType.RANGE) {
    rangeErrors.defaultValue = formState.errors.defaultValue.message!
  }

  const optionErrors: { [key: string]: string } = {}
  if (formState.errors.options) {
    if (typeof formState.errors.options.message === 'string') {
      optionErrors['general'] = formState.errors.options.message
    } else if (Array.isArray(formState.errors.options)) {
      formState.errors.options.forEach((error, index) => {
        if (error?.value) optionErrors[`option-${index}-value`] = error.value.message!
        if (error?.label) optionErrors[`option-${index}-label`] = error.label.message!
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-4">
          {props.fieldIdToEdit ? 'Edit' : 'Create'} Custom Field
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="label"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Display Label
            </label>
            <Input
              id="label"
              {...register('label')}
              placeholder="e.g., Driver Version"
              className="mt-1"
            />
            {formState.errors.label && (
              <p className="text-red-500 text-xs mt-1">{formState.errors.label.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Internal Name (lowercase, underscores)
            </label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., driver_version"
              className="mt-1"
              onChange={(ev) => {
                userHasEditedNameRef.current = true
                register('name').onChange(ev).catch(console.error)
              }}
            />
            {formState.errors.name && (
              <p className="text-red-500 text-xs mt-1">{formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Field Type
            </label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <SelectInput
                  label="Field Type"
                  options={typeOptions}
                  value={field.value}
                  onChange={(ev) => field.onChange(ev.target.value as CustomFieldType)}
                />
              )}
            />
            {formState.errors.type && (
              <p className="text-red-500 text-xs mt-1">{formState.errors.type.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="categoryId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Category (Optional)
            </label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => {
                const categories = categoriesQuery.data ?? []
                const categoryOptions = [
                  { id: '', name: 'Uncategorized' },
                  ...categories.map((cat) => ({ id: cat.id, name: cat.name })),
                ]
                return (
                  <SelectInput
                    label="Category"
                    options={categoryOptions}
                    value={field.value ?? ''}
                    onChange={(ev) => {
                      const value = ev.target.value === '' ? null : ev.target.value
                      field.onChange(value)
                    }}
                  />
                )
              }}
            />
            {formState.errors.categoryId && (
              <p className="text-red-500 text-xs mt-1">{formState.errors.categoryId.message}</p>
            )}
          </div>

          {/* Placeholder for TEXT, TEXTAREA, and URL fields */}
          {(selectedFieldType === CustomFieldType.TEXT ||
            selectedFieldType === CustomFieldType.TEXTAREA ||
            selectedFieldType === CustomFieldType.URL) && (
            <div>
              <label
                htmlFor="placeholder"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Placeholder Text (Optional)
              </label>
              <Input
                id="placeholder"
                {...register('placeholder')}
                placeholder="e.g., Enter driver version..."
                className="mt-1"
              />
              {formState.errors.placeholder && (
                <p className="text-red-500 text-xs mt-1">{formState.errors.placeholder.message}</p>
              )}
            </div>
          )}

          {/* Use shared DefaultValueSelector for non-range types */}
          {selectedFieldType !== CustomFieldType.RANGE &&
            selectedFieldType !== CustomFieldType.TEXTAREA &&
            selectedFieldType !== CustomFieldType.URL && (
              <Controller
                name="defaultValue"
                control={control}
                render={({ field }) => (
                  <DefaultValueSelector
                    fieldType={selectedFieldType}
                    defaultValue={field.value}
                    options={fields}
                    onChange={(value) => field.onChange(value)}
                    error={formState.errors.defaultValue?.message}
                  />
                )}
              />
            )}

          {/* Use shared RangeFieldConfig for RANGE type */}
          {selectedFieldType === CustomFieldType.RANGE && (
            <RangeFieldConfig
              rangeMin={watch('rangeMin')}
              rangeMax={watch('rangeMax')}
              rangeUnit={watch('rangeUnit')}
              rangeDecimals={watch('rangeDecimals')}
              defaultValue={watch('defaultValue') as number | null}
              errors={rangeErrors}
              onChange={handleRangeChange}
            />
          )}

          {/* Use shared SelectFieldOptions for SELECT type */}
          {selectedFieldType === CustomFieldType.SELECT && (
            <SelectFieldOptions
              options={fields}
              errors={optionErrors}
              onAddOption={() => append({ value: '', label: '' })}
              onRemoveOption={(index: number) => remove(index)}
              onUpdateOption={handleUpdateOption}
            />
          )}

          <div className="flex items-center">
            <Controller
              name="isRequired"
              control={control}
              render={({ field }) => (
                <input
                  id="isRequired"
                  type="checkbox"
                  checked={field.value ?? false}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
                />
              )}
            />
            <label
              htmlFor="isRequired"
              className="ml-2 block text-sm text-gray-900 dark:text-gray-100"
            >
              Is Required?
            </label>
            {formState.errors.isRequired && (
              <p className="text-red-500 text-xs mt-1">{formState.errors.isRequired.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="displayOrder"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Display Order
            </label>
            <Input id="displayOrder" type="number" {...register('displayOrder')} className="mt-1" />
            {formState.errors.displayOrder && (
              <p className="text-red-500 text-xs mt-1">{formState.errors.displayOrder.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={props.onClose}
              disabled={formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={formState.isSubmitting}
              disabled={formState.isSubmitting}
            >
              {props.fieldIdToEdit ? 'Update' : 'Create'} Field
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CustomFieldFormModal
