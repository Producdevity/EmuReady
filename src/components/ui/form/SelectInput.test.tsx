import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SelectInput } from './SelectInput'

describe('SelectInput', () => {
  const OPTIONS = [
    { id: 'a', name: 'Alpha' },
    { id: 'b', name: 'Beta' },
  ]

  it('uses "Select <label>" as the empty option text by default', () => {
    render(<SelectInput label="Color" value="" onChange={() => {}} options={OPTIONS} />)
    expect(screen.getByRole('option', { name: 'Select Color' })).toBeInTheDocument()
  })

  it('renders the configured emptyLabel as the empty option text', () => {
    render(
      <SelectInput
        label="Color"
        value=""
        onChange={() => {}}
        options={OPTIONS}
        emptyLabel="No color set"
      />,
    )
    expect(screen.getByRole('option', { name: 'No color set' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Select Color' })).not.toBeInTheDocument()
  })

  it('forwards an empty-string value when the empty option is selected', () => {
    let captured: string | undefined
    const handleChange = (e: { target: { value: string } }) => {
      captured = e.target.value
    }
    render(
      <SelectInput
        label="Color"
        value="a"
        onChange={handleChange}
        options={OPTIONS}
        emptyLabel="No color set"
      />,
    )
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } })
    expect(captured).toBe('')
  })
})
