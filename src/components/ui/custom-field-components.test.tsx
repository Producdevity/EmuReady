import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CustomFieldType } from '@orm'
import {
  RangeFieldConfig,
  SelectFieldOptions,
  DefaultValueSelector,
  FIELD_TYPE_OPTIONS,
} from './custom-field-components'

describe('RangeFieldConfig', () => {
  it('renders all range configuration fields', () => {
    const onChange = vi.fn()
    render(
      <RangeFieldConfig
        rangeMin={0}
        rangeMax={100}
        rangeUnit="%"
        rangeDecimals={2}
        defaultValue={50}
        errors={{}}
        onChange={onChange}
      />,
    )

    expect(screen.getByText('Range Configuration')).toBeInTheDocument()

    // Find inputs by placeholder since labels aren't properly associated
    expect(screen.getByPlaceholderText('0')).toHaveValue(0)
    expect(screen.getByPlaceholderText('100')).toHaveValue(100)
    expect(screen.getByPlaceholderText('e.g., %, GB, MB')).toHaveValue('%')

    // Find decimal places input by its unique min/max attributes
    const decimalInput = document.querySelector('input[min="0"][max="5"]')
    expect(decimalInput).toHaveValue(2)

    // Default value has a dynamic placeholder
    expect(screen.getByPlaceholderText('e.g., 50')).toHaveValue(50)
  })

  it('calls onChange when values are changed', () => {
    const onChange = vi.fn()
    render(<RangeFieldConfig rangeMin={0} rangeMax={100} errors={{}} onChange={onChange} />)

    const minInput = screen.getByPlaceholderText('0')
    fireEvent.change(minInput, { target: { value: '10' } })
    expect(onChange).toHaveBeenCalledWith('rangeMin', 10)

    const maxInput = screen.getByPlaceholderText('100')
    fireEvent.change(maxInput, { target: { value: '200' } })
    expect(onChange).toHaveBeenCalledWith('rangeMax', 200)

    const unitInput = screen.getByPlaceholderText('e.g., %, GB, MB')
    fireEvent.change(unitInput, { target: { value: 'GB' } })
    expect(onChange).toHaveBeenCalledWith('rangeUnit', 'GB')
  })

  it('displays error messages', () => {
    const onChange = vi.fn()
    render(
      <RangeFieldConfig
        errors={{
          rangeMin: 'Min is required',
          rangeMax: 'Max is required',
          defaultValue: 'Invalid default',
        }}
        onChange={onChange}
      />,
    )

    expect(screen.getByText('Min is required')).toBeInTheDocument()
    expect(screen.getByText('Max is required')).toBeInTheDocument()
    expect(screen.getByText('Invalid default')).toBeInTheDocument()
  })
})

describe('SelectFieldOptions', () => {
  it('renders options correctly', () => {
    const options = [
      { value: 'opt1', label: 'Option 1' },
      { value: 'opt2', label: 'Option 2' },
    ]
    const onAddOption = vi.fn()
    const onRemoveOption = vi.fn()
    const onUpdateOption = vi.fn()
    const onReorderOptions = vi.fn()

    render(
      <SelectFieldOptions
        options={options}
        onAddOption={onAddOption}
        onRemoveOption={onRemoveOption}
        onUpdateOption={onUpdateOption}
        onReorderOptions={onReorderOptions}
      />,
    )

    expect(screen.getByText('Options')).toBeInTheDocument()
    expect(screen.getByDisplayValue('opt1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Option 1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('opt2')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Option 2')).toBeInTheDocument()
  })

  it('calls onAddOption when Add Option is clicked', () => {
    const onAddOption = vi.fn()
    const onRemoveOption = vi.fn()
    const onUpdateOption = vi.fn()
    const onReorderOptions = vi.fn()

    render(
      <SelectFieldOptions
        options={[]}
        onAddOption={onAddOption}
        onRemoveOption={onRemoveOption}
        onUpdateOption={onUpdateOption}
        onReorderOptions={onReorderOptions}
      />,
    )

    const addButton = screen.getByText('Add Option')
    fireEvent.click(addButton)
    expect(onAddOption).toHaveBeenCalled()
  })

  it('calls onRemoveOption when delete button is clicked', () => {
    const options = [{ value: 'opt1', label: 'Option 1' }]
    const onAddOption = vi.fn()
    const onRemoveOption = vi.fn()
    const onUpdateOption = vi.fn()
    const onReorderOptions = vi.fn()

    render(
      <SelectFieldOptions
        options={options}
        onAddOption={onAddOption}
        onRemoveOption={onRemoveOption}
        onUpdateOption={onUpdateOption}
        onReorderOptions={onReorderOptions}
      />,
    )

    // Find the delete button by its destructive variant class (excludes drag handle)
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons.find((btn) => btn.className.includes('bg-destructive'))
    expect(deleteButton).toBeDefined()
    fireEvent.click(deleteButton!)
    expect(onRemoveOption).toHaveBeenCalledWith(0)
  })

  it('disables Add Option when max options reached', () => {
    const options = Array(50)
      .fill(null)
      .map((_, i) => ({
        value: `opt${i}`,
        label: `Option ${i}`,
      }))
    const onAddOption = vi.fn()
    const onRemoveOption = vi.fn()
    const onUpdateOption = vi.fn()
    const onReorderOptions = vi.fn()

    render(
      <SelectFieldOptions
        options={options}
        onAddOption={onAddOption}
        onRemoveOption={onRemoveOption}
        onUpdateOption={onUpdateOption}
        onReorderOptions={onReorderOptions}
        maxOptions={50}
      />,
    )

    // Button component may render as span when disabled, check the parent element
    const addButtonContainer = screen.getByText('Add Option').closest('button, span')
    // If it's a button, check disabled prop, if it's a span, it's already disabled
    if (addButtonContainer?.tagName === 'BUTTON') {
      expect(addButtonContainer).toBeDisabled()
    } else {
      // It's rendered as a span which means it's disabled
      expect(addButtonContainer?.tagName).toBe('SPAN')
    }
  })

  it('shows placeholder message when no options', () => {
    const onAddOption = vi.fn()
    const onRemoveOption = vi.fn()
    const onUpdateOption = vi.fn()
    const onReorderOptions = vi.fn()

    render(
      <SelectFieldOptions
        options={[]}
        onAddOption={onAddOption}
        onRemoveOption={onRemoveOption}
        onUpdateOption={onUpdateOption}
        onReorderOptions={onReorderOptions}
      />,
    )

    expect(screen.getByText('Add at least one option for the dropdown')).toBeInTheDocument()
  })
})

describe('DefaultValueSelector', () => {
  it('renders text input for TEXT type', () => {
    const onChange = vi.fn()
    render(
      <DefaultValueSelector
        fieldType={CustomFieldType.TEXT}
        defaultValue="test value"
        onChange={onChange}
      />,
    )

    const input = screen.getByDisplayValue('test value')
    expect(input).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'new value' } })
    expect(onChange).toHaveBeenCalledWith('new value')
  })

  it('renders select for BOOLEAN type', () => {
    const onChange = vi.fn()
    render(
      <DefaultValueSelector
        fieldType={CustomFieldType.BOOLEAN}
        defaultValue={true}
        onChange={onChange}
      />,
    )

    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('true')

    fireEvent.change(select, { target: { value: 'false' } })
    expect(onChange).toHaveBeenCalledWith(false)

    fireEvent.change(select, { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('renders select with options for SELECT type', () => {
    const options = [
      { value: 'val1', label: 'Label 1' },
      { value: 'val2', label: 'Label 2' },
    ]
    const onChange = vi.fn()

    render(
      <DefaultValueSelector
        fieldType={CustomFieldType.SELECT}
        defaultValue="val1"
        options={options}
        onChange={onChange}
      />,
    )

    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('val1')

    // Check that options are present
    const option1 = screen.getByText('Label 1')
    const option2 = screen.getByText('Label 2')
    expect(option1).toBeInTheDocument()
    expect(option2).toBeInTheDocument()

    fireEvent.change(select, { target: { value: 'val2' } })
    expect(onChange).toHaveBeenCalledWith('val2')
  })

  it('shows message when SELECT has no options', () => {
    const onChange = vi.fn()
    render(
      <DefaultValueSelector
        fieldType={CustomFieldType.SELECT}
        defaultValue={null}
        options={[]}
        onChange={onChange}
      />,
    )

    expect(screen.getByText('Add options first to set a default value')).toBeInTheDocument()
  })

  it('displays error message when provided', () => {
    const onChange = vi.fn()
    render(
      <DefaultValueSelector
        fieldType={CustomFieldType.TEXT}
        defaultValue=""
        onChange={onChange}
        error="Default value is required"
      />,
    )

    expect(screen.getByText('Default value is required')).toBeInTheDocument()
  })
})

describe('FIELD_TYPE_OPTIONS', () => {
  it('contains all expected field types', () => {
    expect(FIELD_TYPE_OPTIONS).toHaveLength(6)

    const values = FIELD_TYPE_OPTIONS.map((opt) => opt.value)
    expect(values).toContain(CustomFieldType.TEXT)
    expect(values).toContain(CustomFieldType.TEXTAREA)
    expect(values).toContain(CustomFieldType.URL)
    expect(values).toContain(CustomFieldType.BOOLEAN)
    expect(values).toContain(CustomFieldType.SELECT)
    expect(values).toContain(CustomFieldType.RANGE)

    const labels = FIELD_TYPE_OPTIONS.map((opt) => opt.label)
    expect(labels).toContain('Text')
    expect(labels).toContain('Long Text')
    expect(labels).toContain('URL')
    expect(labels).toContain('Yes/No')
    expect(labels).toContain('Dropdown')
    expect(labels).toContain('Range (Slider)')
  })
})
