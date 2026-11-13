import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Autocomplete, Button, Input } from '@/components/ui'
import { type DriverRelease } from '@/types/driver-versions'
import { reconcileDriverValue } from '../../shared/driver-version'

const baseOptions = [
  { label: 'Select for Non-Android Device', value: 'N/A', name: 'Select for Non-Android Device' },
  { label: 'Default System Driver', value: 'Default System Driver', name: 'Default System Driver' },
]
const customOption = { label: 'Custom driver…', value: '__custom_driver__', name: 'Custom driver' }
type DriverOption = DriverRelease | (typeof baseOptions)[number]

interface Props {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  inputRef: (input: HTMLInputElement | null) => void
  driverReleases: DriverRelease[] | null
  placeholder: string
  leftIcon: ReactNode
  className?: string
  errorId?: string
}

export function DriverVersionInput(props: Props) {
  const { inputRef, ...input } = props
  const [customSelected, setCustomSelected] = useState(false)
  const options = useMemo(
    () => [...baseOptions, ...(input.driverReleases ?? []), customOption],
    [input.driverReleases],
  )
  const canonicalValue = reconcileDriverValue(input.value, input.driverReleases)
  const listedValue = canonicalValue ?? input.value
  const isListed = options.some((option) => option !== customOption && option.value === listedValue)
  const customMode = customSelected || (input.value !== '' && !isListed)
  const onChange = input.onChange

  useEffect(() => {
    if (canonicalValue && !customMode) onChange(canonicalValue)
  }, [canonicalValue, customMode, onChange])

  if (customMode) {
    return (
      <div className="space-y-2">
        <Input
          id={input.id}
          ref={inputRef}
          autoFocus={customSelected}
          value={input.value}
          onChange={(event) => {
            setCustomSelected(true)
            onChange(event.target.value)
          }}
          onBlur={input.onBlur}
          leftIcon={input.leftIcon}
          placeholder="Enter your graphics driver name and version"
          className={input.className}
          aria-describedby={input.errorId}
          aria-invalid={input.errorId ? true : undefined}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setCustomSelected(false)
            onChange('')
          }}
        >
          Choose a listed driver
        </Button>
      </div>
    )
  }

  return (
    <Autocomplete<DriverOption>
      id={input.id}
      value={listedValue}
      onChange={(value) => {
        if (value === customOption.value) {
          setCustomSelected(true)
          onChange(isListed ? '' : input.value)
        } else {
          onChange(value ?? '')
        }
      }}
      onBlur={input.onBlur}
      items={options}
      inputRef={inputRef}
      leftIcon={input.leftIcon}
      optionToValue={(option) => option.value}
      optionToLabel={(option) => option.label}
      minCharsToTrigger={0}
      debounceTime={300}
      placeholder={input.placeholder}
      inputClassName={input.className}
      aria-describedby={input.errorId}
      aria-invalid={input.errorId ? true : undefined}
      filterKeys={['name', 'label', 'value']}
    />
  )
}
