import { createRef } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Input from './Input'

describe('Input', () => {
  it('renders input element by default', () => {
    render(<Input placeholder="Test placeholder" />)
    const inputElement = screen.getByPlaceholderText('Test placeholder')
    expect(inputElement).toBeInTheDocument()
    expect(inputElement.tagName).toBe('INPUT')
  })

  it('handles value changes', () => {
    const handleChange = vi.fn()
    render(<Input value="initial" onChange={handleChange} />)

    const inputElement = screen.getByDisplayValue('initial')
    fireEvent.change(inputElement, { target: { value: 'updated' } })

    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('renders as textarea when as="textarea"', () => {
    render(<Input as="textarea" placeholder="Textarea" rows={4} />)

    const textareaElement = screen.getByPlaceholderText('Textarea')
    expect(textareaElement.tagName).toBe('TEXTAREA')
    expect(textareaElement).toHaveAttribute('rows', '4')
  })

  it('renders as select when as="select"', () => {
    render(
      <Input as="select" defaultValue="option2">
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </Input>,
    )

    const selectElement = screen.getByRole('combobox')
    expect(selectElement.tagName).toBe('SELECT')
    expect(selectElement).toHaveValue('option2')
  })

  it('renders left icon when provided', () => {
    const leftIcon = <span data-testid="left-icon">🔍</span>
    render(<Input leftIcon={leftIcon} placeholder="Search" />)

    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    const inputElement = screen.getByPlaceholderText('Search')
    expect(inputElement).toHaveClass('pl-2')
  })

  it('renders right icon when provided', () => {
    const rightIcon = <span data-testid="right-icon">✖</span>
    render(<Input rightIcon={rightIcon} placeholder="Clear" />)

    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    const inputElement = screen.getByPlaceholderText('Clear')
    expect(inputElement).toHaveClass('pr-10')
  })

  it('applies custom className to the container', () => {
    render(<Input className="custom-class" placeholder="Test" />)

    const container = screen.getByPlaceholderText('Test').parentElement
    expect(container).toHaveClass('custom-class')
  })

  it('forwards ref to the input element', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} placeholder="Test ref" />)

    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe('INPUT')
    expect(ref.current).toBe(screen.getByPlaceholderText('Test ref'))
  })
})
