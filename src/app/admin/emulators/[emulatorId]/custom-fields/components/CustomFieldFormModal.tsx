'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { toSnakeCase } from 'remeda'
import { z } from 'zod'
import { Button, Input, SelectInput } from '@/components/ui'
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
  options: z.array(customFieldOptionSchema).optional(),
  defaultValue: z
    .union([z.string(), z.boolean(), z.number(), z.null()])
    .optional(),
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

type CustomFieldUpdatePayload = {
  id: string
  name?: string
  label?: string
  type?: CustomFieldType
  options?: { value: string; label: string }[] | undefined
  defaultValue?: string | boolean | number | null
  placeholder?: string
  rangeMin?: number
  rangeMax?: number
  rangeUnit?: string
  rangeDecimals?: number
  isRequired?: boolean
  displayOrder?: number
}

type CustomFieldCreatePayload = {
  emulatorId: string
  name: string
  label: string
  type: CustomFieldType
  options?: { value: string; label: string }[] | undefined
  defaultValue?: string | boolean | number | null
  placeholder?: string
  rangeMin?: number
  rangeMax?: number
  rangeUnit?: string
  rangeDecimals?: number
  isRequired: boolean
  displayOrder: number
}

interface Props {
  emulatorId: string
  fieldIdToEdit?: string | null
  isOpen: boolean
  onClose: () => void
}

function CustomFieldFormModal(props: Props) {
  const utils = api.useUtils()
  const [userHasEditedName, setUserHasEditedName] = useState(false)

  const { data: fieldToEditData, isLoading: isLoadingFieldToEdit } =
    api.customFieldDefinitions.byId.useQuery(
      { id: props.fieldIdToEdit! },
      { enabled: !!props.fieldIdToEdit },
    )

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomFieldFormValues>({
    resolver: zodResolver(customFieldFormSchema),
    defaultValues: {
      name: '',
      label: '',
      type: CustomFieldType.TEXT,
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
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  })

  // Autopopulate field name from label
  useEffect(() => {
    if (!userHasEditedName && watchedLabel && !props.fieldIdToEdit) {
      const snakeCaseName = toSnakeCase(watchedLabel)
      setValue('name', snakeCaseName)
    }
  }, [watchedLabel, userHasEditedName, props.fieldIdToEdit, setValue])

  useEffect(() => {
    if (fieldToEditData) {
      const opts = Array.isArray(fieldToEditData.options)
        ? (fieldToEditData.options as { value: string; label: string }[])
        : []
      reset({
        name: fieldToEditData.name,
        label: fieldToEditData.label,
        type: fieldToEditData.type,
        options: opts,
        defaultValue: fieldToEditData.defaultValue as
          | string
          | boolean
          | number
          | null,
        placeholder: fieldToEditData.placeholder || '',
        rangeMin: fieldToEditData.rangeMin || 0,
        rangeMax: fieldToEditData.rangeMax || 100,
        rangeUnit: fieldToEditData.rangeUnit || '',
        rangeDecimals: fieldToEditData.rangeDecimals || 0,
        isRequired: fieldToEditData.isRequired,
        displayOrder: fieldToEditData.displayOrder,
      })
      setUserHasEditedName(true) // Don't auto-populate when editing
    } else if (!props.fieldIdToEdit) {
      reset({
        name: '',
        label: '',
        type: CustomFieldType.TEXT,
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
      setUserHasEditedName(false)
    }
  }, [fieldToEditData, props.fieldIdToEdit, reset])

  const createMutation = api.customFieldDefinitions.create.useMutation({
    onSuccess: () => {
      utils.customFieldDefinitions.getByEmulator
        .invalidate({ emulatorId: props.emulatorId })
        .catch(console.error)
      props.onClose()
    },
    onError: (error) => {
      console.error('Error creating custom field:', error)
      toast.error(
        `Failed to create custom field: ${getErrorMessage(error.message)}`,
      )
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
    },
    onError: (error) => {
      console.error('Error updating custom field:', error)
      toast.error(
        `Failed to update custom field: ${getErrorMessage(error.message)}`,
      )
    },
  })

  const onSubmit = (data: CustomFieldFormValues) => {
    const basePayload = {
      name: data.name,
      label: data.label,
      type: data.type,
      isRequired: data.isRequired ?? false,
      displayOrder: data.displayOrder ?? 0,
      options: undefined as { value: string; label: string }[] | undefined,
      defaultValue:
        data.defaultValue === null || data.defaultValue === undefined
          ? undefined
          : data.defaultValue,
      placeholder: data.placeholder || undefined,
      rangeMin: undefined as number | undefined,
      rangeMax: undefined as number | undefined,
      rangeUnit: undefined as string | undefined,
      rangeDecimals: undefined as number | undefined,
    }

    if (data.type === CustomFieldType.SELECT) {
      if (data.options && data.options.length > 0) {
        basePayload.options = data.options
      } else {
        return toast.warning('Options are required for SELECT type fields.')
      }
    }

    if (data.type === CustomFieldType.RANGE) {
      if (data.rangeMin !== undefined && data.rangeMax !== undefined) {
        if (data.rangeMin >= data.rangeMax) {
          return toast.error('Range minimum must be less than maximum.')
        }
        basePayload.rangeMin = data.rangeMin
        basePayload.rangeMax = data.rangeMax
        basePayload.rangeUnit = data.rangeUnit || ''
        basePayload.rangeDecimals = data.rangeDecimals || 0
      } else {
        return toast.warning(
          'Range minimum and maximum are required for RANGE type fields.',
        )
      }
    }

    if (props.fieldIdToEdit) {
      const updatePayload: CustomFieldUpdatePayload = {
        id: props.fieldIdToEdit,
        ...basePayload,
      }
      return updateMutation.mutate(updatePayload)
    }

    const createPayload: CustomFieldCreatePayload = {
      emulatorId: props.emulatorId,
      ...basePayload,
    }
    createMutation.mutate(createPayload)
  }

  // Auto-populate option values from labels
  const handleOptionLabelChange = (index: number, label: string) => {
    const currentValue = fields[index]?.value
    if (!currentValue || currentValue.trim() === '') {
      setValue(`options.${index}.value`, label)
    }
    setValue(`options.${index}.label`, label)
  }

  const handleOptionValueChange = (index: number, value: string) => {
    const currentLabel = fields[index]?.label
    if (!currentLabel || currentLabel.trim() === '') {
      setValue(`options.${index}.label`, value)
    }
    setValue(`options.${index}.value`, value)
  }

  if (!props.isOpen) return null
  if (props.fieldIdToEdit && isLoadingFieldToEdit)
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <p>Loading field data...</p>
      </div>
    )

  const typeOptions = Object.values(CustomFieldType).map((type) => ({
    value: type,
    label: type === CustomFieldType.RANGE ? 'Range (Slider)' : type,
  }))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
            {errors.label && (
              <p className="text-red-500 text-xs mt-1">
                {errors.label.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Internal Name (lowercase,_)
            </label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., driver_version"
              className="mt-1"
              onChange={(e) => {
                setUserHasEditedName(true)
                register('name').onChange(e)
              }}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
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
                  options={typeOptions.map((opt) => ({
                    id: opt.value,
                    name: opt.label,
                  }))}
                  value={field.value}
                  onChange={(ev) =>
                    field.onChange(ev.target.value as CustomFieldType)
                  }
                />
              )}
            />
            {errors.type && (
              <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>
            )}
          </div>

          {/* Placeholder for TEXT fields */}
          {selectedFieldType === CustomFieldType.TEXT && (
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
              {errors.placeholder && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.placeholder.message}
                </p>
              )}
            </div>
          )}

          {/* Range Configuration */}
          {selectedFieldType === CustomFieldType.RANGE && (
            <div className="space-y-4 p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">
                Range Configuration
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="rangeMin"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Minimum Value
                  </label>
                  <Input
                    id="rangeMin"
                    type="number"
                    step="any"
                    {...register('rangeMin')}
                    placeholder="0"
                    className="mt-1"
                  />
                  {errors.rangeMin && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.rangeMin.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="rangeMax"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Maximum Value
                  </label>
                  <Input
                    id="rangeMax"
                    type="number"
                    step="any"
                    {...register('rangeMax')}
                    placeholder="100"
                    className="mt-1"
                  />
                  {errors.rangeMax && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.rangeMax.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="rangeUnit"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Unit (Optional)
                  </label>
                  <Input
                    id="rangeUnit"
                    {...register('rangeUnit')}
                    placeholder="e.g., %, GB, MB"
                    className="mt-1"
                  />
                  {errors.rangeUnit && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.rangeUnit.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="rangeDecimals"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Decimal Places
                  </label>
                  <Controller
                    name="rangeDecimals"
                    control={control}
                    render={({ field }) => (
                      <SelectInput
                        label="Decimal Places"
                        options={[
                          { id: '0', name: '0 (integers)' },
                          { id: '1', name: '1 decimal place' },
                          { id: '2', name: '2 decimal places' },
                        ]}
                        value={String(field.value || 0)}
                        onChange={(ev) =>
                          field.onChange(Number(ev.target.value))
                        }
                      />
                    )}
                  />
                  {errors.rangeDecimals && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.rangeDecimals.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Default Value Section */}
          {(selectedFieldType === CustomFieldType.BOOLEAN ||
            selectedFieldType === CustomFieldType.SELECT ||
            selectedFieldType === CustomFieldType.RANGE) && (
            <div>
              <label
                htmlFor="defaultValue"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Default Value (Optional)
              </label>
              {selectedFieldType === CustomFieldType.BOOLEAN ? (
                <Controller
                  name="defaultValue"
                  control={control}
                  render={({ field }) => (
                    <SelectInput
                      label="Default Value"
                      options={[
                        { id: '', name: 'No default' },
                        { id: 'true', name: 'Yes' },
                        { id: 'false', name: 'No' },
                      ]}
                      value={
                        field.value === null || field.value === undefined
                          ? ''
                          : String(field.value)
                      }
                      onChange={(ev) => {
                        const value = ev.target.value
                        if (value === '') {
                          field.onChange(null)
                        } else {
                          field.onChange(value === 'true')
                        }
                      }}
                    />
                  )}
                />
              ) : selectedFieldType === CustomFieldType.RANGE ? (
                <Input
                  type="number"
                  step="any"
                  {...register('defaultValue')}
                  placeholder="Default value within range"
                  className="mt-1"
                />
              ) : selectedFieldType === CustomFieldType.SELECT &&
                fields.length > 0 ? (
                <Controller
                  name="defaultValue"
                  control={control}
                  render={({ field }) => (
                    <SelectInput
                      label="Default Value"
                      options={[
                        { id: '', name: 'No default' },
                        ...fields
                          .filter(
                            (opt) => opt.value?.trim() && opt.label?.trim(),
                          )
                          .map((option) => ({
                            id: option.value,
                            name: option.label,
                          })),
                      ]}
                      value={field.value === null ? '' : String(field.value)}
                      onChange={(ev) =>
                        field.onChange(
                          ev.target.value === '' ? null : ev.target.value,
                        )
                      }
                    />
                  )}
                />
              ) : selectedFieldType === CustomFieldType.SELECT ? (
                <p className="text-sm text-gray-500 italic mt-1">
                  Add options first to set a default value
                </p>
              ) : null}
              {errors.defaultValue && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.defaultValue.message}
                </p>
              )}
            </div>
          )}

          {selectedFieldType === CustomFieldType.SELECT && (
            <div className="space-y-3 p-3 border rounded-md dark:border-gray-700">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">
                Dropdown Options
              </h3>
              {fields.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-2 p-2 border-b dark:border-gray-600"
                >
                  <Input
                    {...register(`options.${index}.value`)}
                    placeholder="Value (e.g., v1.0)"
                    className="flex-1"
                    onChange={(e) =>
                      handleOptionValueChange(index, e.target.value)
                    }
                  />
                  <Input
                    {...register(`options.${index}.label`)}
                    placeholder="Label (e.g., Version 1.0)"
                    className="flex-1"
                    onChange={(e) =>
                      handleOptionLabelChange(index, e.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    aria-label="Remove option"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              {errors.options?.message && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.options.message}
                </p>
              )}
              {Array.isArray(errors.options) &&
                errors.options.map((optError, index) => (
                  <div key={index} className="text-red-500 text-xs">
                    {optError?.value && (
                      <p>{`Option ${index + 1} Value: ${optError.value.message}`}</p>
                    )}
                    {optError?.label && (
                      <p>{`Option ${index + 1} Label: ${optError.label.message}`}</p>
                    )}
                  </div>
                ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ value: '', label: '' })}
                className="mt-2"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Option
              </Button>
            </div>
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
            {errors.isRequired && (
              <p className="text-red-500 text-xs mt-1">
                {errors.isRequired.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="displayOrder"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Display Order
            </label>
            <Input
              id="displayOrder"
              type="number"
              {...register('displayOrder')}
              className="mt-1"
            />
            {errors.displayOrder && (
              <p className="text-red-500 text-xs mt-1">
                {errors.displayOrder.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={props.onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
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
