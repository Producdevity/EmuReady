import { Controller, type Control, type FieldValues, type FieldPath } from 'react-hook-form'
import { isString } from 'remeda'
import { type CustomFieldType } from '@orm'
import { CustomFieldRenderer, type CustomFieldDefinitionWithOptions } from '../CustomFieldRenderer'

interface CustomFieldDefinition {
  id: string
  name: string
  label: string
  type: CustomFieldType
  options?: unknown
  defaultValue?: unknown
  placeholder?: string | null
  isRequired: boolean
  displayOrder: number
  rangeMin?: number | null
  rangeMax?: number | null
  rangeUnit?: string | null
  rangeDecimals?: number | null
}

export function transformFieldDefinition(
  fieldDef: CustomFieldDefinition,
): CustomFieldDefinitionWithOptions {
  return {
    ...fieldDef,
    defaultValue: fieldDef.defaultValue as string | number | boolean | null | undefined,
    parsedOptions: fieldDef.options
      ? Array.isArray(fieldDef.options)
        ? (fieldDef.options as { value: string; label: string }[])
        : []
      : undefined,
  }
}

export function getFieldErrorMessage(fieldError: unknown): string | undefined {
  return typeof fieldError === 'string'
    ? fieldError
    : fieldError && typeof fieldError === 'object' && 'message' in fieldError
      ? String((fieldError as { message: unknown }).message)
      : undefined
}

interface RenderCustomFieldProps<TFieldValues extends FieldValues = FieldValues> {
  fieldDef: CustomFieldDefinition
  index: number
  control: Control<TFieldValues>
  formErrors: Record<string, unknown>
  fieldNamePrefix?: string
}

export function renderCustomField<TFieldValues extends FieldValues = FieldValues>({
  fieldDef,
  index,
  control,
  formErrors,
  fieldNamePrefix = 'customFieldValues',
}: RenderCustomFieldProps<TFieldValues>) {
  const fieldName = `${fieldNamePrefix}.${index}.value` as FieldPath<TFieldValues>
  const customFieldErrors = formErrors[fieldNamePrefix] as
    | Record<number, { value?: unknown }>
    | undefined
  const fieldError = customFieldErrors?.[index]?.value
  const errorMessage = getFieldErrorMessage(fieldError)
  const transformedFieldDef = transformFieldDefinition(fieldDef)

  return (
    <div key={fieldDef.id}>
      <Controller
        name={`${fieldNamePrefix}.${index}.customFieldDefinitionId` as FieldPath<TFieldValues>}
        control={control}
        defaultValue={fieldDef.id as TFieldValues[FieldPath<TFieldValues>]}
        rules={{ required: true }}
        render={({ field }) => (
          <input
            type="hidden"
            name={field.name}
            value={(field.value ?? fieldDef.id) as string}
            onChange={field.onChange}
            ref={field.ref}
          />
        )}
      />
      <CustomFieldRenderer
        fieldDef={transformedFieldDef}
        fieldName={fieldName}
        index={index}
        control={control}
        errorMessage={errorMessage}
      />
    </div>
  )
}

export function isCustomFieldValueEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'boolean') return false
  if (typeof value === 'number') return Number.isNaN(value)
  if (isString(value)) return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (value instanceof Date) return false
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length === 0

  return false
}
