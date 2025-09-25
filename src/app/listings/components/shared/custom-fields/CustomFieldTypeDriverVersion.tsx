import { type ReactNode, useEffect, useMemo, useCallback } from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Autocomplete, type AutocompleteOptionBase } from '@/components/ui'
import { cn } from '@/lib/utils'
import { type DriverRelease, useDriverVersions } from './hooks/useDriverVersions'

const baseOptions: DriverReleaseOption[] = [
  {
    label: 'Select for Non-Android Device',
    value: 'N/A',
    name: 'Select for Non-Android Device',
  },
  {
    label: 'Default System Driver',
    value: 'Default System Driver',
    name: 'Default System Driver',
  },
]

interface DriverPlaceholderOption extends AutocompleteOptionBase {
  label: string
  value: string
  name?: string
}

type DriverReleaseOption = DriverRelease | DriverPlaceholderOption

interface CustomFieldDefinitionWithOptions {
  id: string
  name: string
  label: string
  isRequired: boolean
  placeholder?: string | null
}

interface ValidationRules {
  required: string | boolean
  validate?: (value: unknown) => boolean | string
}

interface Props<TFieldValues extends FieldValues = FieldValues> {
  fieldDef: CustomFieldDefinitionWithOptions
  fieldName: FieldPath<TFieldValues>
  index: number
  rules: ValidationRules
  control: Control<TFieldValues>
  errorMessage: string | undefined
  icon: ReactNode
}

function CustomFieldTypeDriverVersion<TFieldValues extends FieldValues = FieldValues>(
  props: Props<TFieldValues>,
) {
  const driverVersions = useDriverVersions()

  const selectOptions: DriverReleaseOption[] = useMemo(
    () => (driverVersions.data ? [...baseOptions, ...driverVersions.data] : baseOptions),
    [driverVersions.data],
  )

  const loadItems = useCallback(
    async (query: string): Promise<DriverReleaseOption[]> => {
      const all = selectOptions
      if (!query) return all
      const q = query.toLowerCase()
      return all.filter((opt) => {
        const label = (opt as DriverReleaseOption).label?.toLowerCase?.() || ''
        const value = (opt as DriverReleaseOption).value?.toLowerCase?.() || ''
        const name =
          ((opt as DriverReleaseOption).name as string | undefined)?.toLowerCase?.() || ''
        return label.includes(q) || value.includes(q) || name.includes(q)
      })
    },
    [selectOptions],
  )

  const helperMessage = driverVersions.errorMessage
    ? driverVersions.errorMessage
    : driverVersions.rateLimited
      ? 'GitHub rate limit exceeded. Please try again in a few minutes or select a default option.'
      : null

  return (
    <div key={props.fieldDef.id} className="mb-4">
      <label
        htmlFor={props.fieldName}
        className="pl-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {props.fieldDef.label} {props.fieldDef.isRequired && '*'}
      </label>
      <Controller
        name={props.fieldName}
        control={props.control}
        rules={props.rules}
        render={({ field }) => (
          <DriverVersionAutocomplete
            id={props.fieldName}
            value={field.value as string}
            onChange={(value) => field.onChange(value ?? '')}
            loadItems={loadItems}
            leftIcon={props.icon}
            placeholder={
              props.fieldDef.placeholder || `Enter ${props.fieldDef.label.toLowerCase()}`
            }
            inputClassName={cn(
              'w-full mt-2',
              props.errorMessage &&
                'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500',
            )}
            disabled={driverVersions.loading && !driverVersions.data}
            driverReleases={driverVersions.data}
          />
        )}
      />
      {driverVersions.loading && !driverVersions.data && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading driver versions…</p>
      )}
      {helperMessage && (
        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">{helperMessage}</p>
      )}
      {props.errorMessage && <p className="text-red-500 text-xs mt-1">{props.errorMessage}</p>}
    </div>
  )
}

export default CustomFieldTypeDriverVersion

interface DriverVersionAutocompleteProps {
  id: string
  value: string | null
  onChange: (v: string | null) => void
  loadItems: (q: string) => Promise<DriverReleaseOption[]>
  leftIcon: ReactNode
  placeholder: string
  inputClassName?: string
  disabled?: boolean
  driverReleases: DriverRelease[] | null
}

function DriverVersionAutocomplete(props: DriverVersionAutocompleteProps) {
  const { driverReleases, value, onChange } = props
  // Reconcile filename or plain value to canonical option when driver list arrives
  useEffect(() => {
    const current = String(value ?? '')
    if (!current || current.includes('|||') || !driverReleases) return
    const filename = current.split('/').pop()
    const match = driverReleases.find((rel) => {
      if (rel.value && rel.value.includes('|||')) {
        return rel.value.split('|||')[1] === filename
      }
      return rel.assets?.some((a) => a.name === filename)
    })
    if (match) onChange(match.value)
  }, [driverReleases, value, onChange])

  return (
    <Autocomplete<DriverReleaseOption>
      id={props.id}
      value={props.value ?? ''}
      onChange={(value) => props.onChange(value ?? '')}
      loadItems={props.loadItems}
      leftIcon={props.leftIcon}
      optionToValue={(driverVersion) => driverVersion.value}
      optionToLabel={(driverVersion) => driverVersion.label}
      minCharsToTrigger={0}
      debounceTime={300}
      placeholder={props.placeholder}
      className={props.inputClassName}
      filterKeys={['name', 'label', 'value']}
      disabled={props.disabled}
    />
  )
}
