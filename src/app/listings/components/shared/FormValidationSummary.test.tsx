import { render, screen } from '@testing-library/react'
import { type FieldErrors } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import FormValidationSummary from './FormValidationSummary'

describe('FormValidationSummary', () => {
  it('maps generic required message to field label for standard fields', () => {
    const errors = {
      gameId: { message: 'Required' },
    } as FieldErrors<{ gameId: string }>

    render(<FormValidationSummary errors={errors} fieldLabels={{ gameId: 'Game' }} />)

    expect(screen.getByText(/Game is required/)).toBeInTheDocument()
  })

  it('maps generic required message to custom field label', () => {
    const errors = {
      customFieldValues: [
        {
          value: { message: 'Required' },
        },
      ],
    } as unknown as FieldErrors<{ customFieldValues: { value: unknown }[] }>

    const customFieldDefinitions = [{ id: 'cf-1', label: 'Texture Filter', name: 'texture_filter' }]

    render(
      <FormValidationSummary
        errors={errors}
        customFieldDefinitions={customFieldDefinitions}
        fieldLabels={{}}
      />,
    )

    expect(screen.getByText(/Texture Filter is required/)).toBeInTheDocument()
  })

  it('handles root-level custom field errors by surfacing each field name', () => {
    const errors = {
      customFieldValues: {
        message: 'Required',
        0: {
          value: { message: 'Required' },
        },
      },
    } as unknown as FieldErrors<{ customFieldValues: { value: unknown }[] }>

    const customFieldDefinitions = [
      { id: 'cf-1', label: 'Internal Resolution', name: 'internal_resolution' },
    ]

    render(
      <FormValidationSummary
        errors={errors}
        customFieldDefinitions={customFieldDefinitions}
        fieldLabels={{}}
      />,
    )

    expect(screen.getByText(/Internal Resolution is required/)).toBeInTheDocument()
  })

  it('formats root-level custom field errors when no index is provided', () => {
    const errors = {
      customFieldValues: { message: 'Required' },
    } as unknown as FieldErrors<{ customFieldValues: unknown }>

    render(<FormValidationSummary errors={errors} customFieldDefinitions={[]} fieldLabels={{}} />)

    expect(screen.getByText(/Custom fields are required/)).toBeInTheDocument()
  })

  it('formats unknown field keys into readable labels', () => {
    const errors = {
      someFieldKey: { message: 'Required' },
    } as FieldErrors<{ someFieldKey: string }>

    render(<FormValidationSummary errors={errors} />)

    expect(screen.getByText(/Some Field Key is required/)).toBeInTheDocument()
  })
})
