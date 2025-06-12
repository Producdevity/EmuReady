import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, it, expect, vi } from 'vitest'
import { type ListingFormValues } from '@/app/listings/new/page'
import { CustomFieldType } from '@orm'
import CustomFieldTypeSelect from './CustomFieldTypeSelect'

vi.mock('@/components/ui', () => ({
  SelectInput: ({ label, options, value, onChange, leftIcon }: any) => (
    <div>
      <label>{label}</label>
      {leftIcon}
      <select value={value} onChange={onChange} data-testid="select-input">
        {options.map((option: any) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  ),
}))

function TestWrapper() {
  const { control } = useForm<ListingFormValues>({
    defaultValues: {
      gameId: 'game-1',
      deviceId: 'device-1',
      emulatorId: 'emulator-1',
      performanceId: 1,
      notes: '',
      customFieldValues: [
        {
          customFieldDefinitionId: 'field-1',
          value: 'option1',
        },
      ],
    },
  })

  const fieldDef = {
    id: 'field-1',
    name: 'test_field',
    label: 'Test Field',
    type: CustomFieldType.SELECT,
    isRequired: true,
    parsedOptions: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ],
  }

  const rules = {
    required: 'Test Field is required',
  }

  return (
    <CustomFieldTypeSelect
      fieldDef={fieldDef}
      fieldName="customFieldValues.0.value"
      index={0}
      rules={rules}
      control={control}
      errorMessage={undefined}
      icon={<span>📝</span>}
    />
  )
}

function TestWrapperWithError() {
  const { control } = useForm<ListingFormValues>({
    defaultValues: {
      gameId: 'game-1',
      deviceId: 'device-1',
      emulatorId: 'emulator-1',
      performanceId: 1,
      notes: '',
      customFieldValues: [
        {
          customFieldDefinitionId: 'field-1',
          value: '',
        },
      ],
    },
  })

  const fieldDef = {
    id: 'field-1',
    name: 'test_field',
    label: 'Test Field',
    type: CustomFieldType.SELECT,
    isRequired: true,
    parsedOptions: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ],
  }

  const rules = {
    required: 'Test Field is required',
  }

  return (
    <CustomFieldTypeSelect
      fieldDef={fieldDef}
      fieldName="customFieldValues.0.value"
      index={0}
      rules={rules}
      control={control}
      errorMessage="This field is required"
      icon={<span>📝</span>}
    />
  )
}

describe('CustomFieldTypeSelect', () => {
  it('should render a select field with options', () => {
    render(<TestWrapper />)

    expect(screen.getByText('Test Field *')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Option 1')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument()
    expect(screen.getByText('📝')).toBeInTheDocument()
  })

  it('should show error message when provided', () => {
    render(<TestWrapperWithError />)

    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })
})
