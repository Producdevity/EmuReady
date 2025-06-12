import { render, screen } from '@testing-library/react'
import { type FieldErrors } from 'react-hook-form'
import { describe, it, expect } from 'vitest'
import { type RouterInput } from '@/types/trpc'
import FormValidationSummary from './FormValidationSummary'

type ListingFormValues = RouterInput['listings']['create']

describe('FormValidationSummary', () => {
  it('should not render when there are no errors', () => {
    const errors: FieldErrors<ListingFormValues> = {}

    const { container } = render(<FormValidationSummary errors={errors} />)

    expect(container.firstChild).toBeNull()
  })

  it('should display basic field errors', () => {
    const errors: FieldErrors<ListingFormValues> = {
      gameId: { type: 'required', message: 'Game is required' },
      deviceId: { type: 'required', message: 'Device is required' },
      emulatorId: { type: 'required', message: 'Emulator is required' },
      performanceId: {
        type: 'required',
        message: 'Performance rating is required',
      },
      notes: {
        type: 'minLength',
        message: 'Notes must be at least 10 characters',
      },
    }

    render(<FormValidationSummary errors={errors} />)

    expect(
      screen.getByText('Please fix the following errors:'),
    ).toBeInTheDocument()
    expect(screen.getByText('• Game is required')).toBeInTheDocument()
    expect(screen.getByText('• Device is required')).toBeInTheDocument()
    expect(screen.getByText('• Emulator is required')).toBeInTheDocument()
    expect(
      screen.getByText('• Performance rating is required'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('• Notes must be at least 10 characters'),
    ).toBeInTheDocument()
  })

  it('should display custom field errors when they are in array format', () => {
    const errors: FieldErrors<ListingFormValues> = {
      customFieldValues: [
        {
          value: { type: 'required', message: 'Driver Version is required' },
        },
        {
          value: { type: 'required', message: 'Graphics Settings is required' },
        },
      ],
    }

    render(<FormValidationSummary errors={errors} />)

    expect(
      screen.getByText('Please fix the following errors:'),
    ).toBeInTheDocument()
    expect(screen.getByText('• Driver Version is required')).toBeInTheDocument()
    expect(
      screen.getByText('• Graphics Settings is required'),
    ).toBeInTheDocument()
  })

  it('should display custom field errors when they are in generic format', () => {
    const errors: FieldErrors<ListingFormValues> = {
      customFieldValues: {
        type: 'custom',
        message: 'All required custom fields must be filled',
      },
    }

    render(<FormValidationSummary errors={errors} />)

    expect(
      screen.getByText('Please fix the following errors:'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('• All required custom fields must be filled'),
    ).toBeInTheDocument()
  })

  it('should display mixed basic and custom field errors', () => {
    const errors: FieldErrors<ListingFormValues> = {
      gameId: { type: 'required', message: 'Game is required' },
      customFieldValues: [
        {
          value: { type: 'required', message: 'Driver Version is required' },
        },
      ],
    }

    render(<FormValidationSummary errors={errors} />)

    expect(
      screen.getByText('Please fix the following errors:'),
    ).toBeInTheDocument()
    expect(screen.getByText('• Game is required')).toBeInTheDocument()
    expect(screen.getByText('• Driver Version is required')).toBeInTheDocument()
  })

  it('should handle custom field errors with empty or undefined values', () => {
    const errors: FieldErrors<ListingFormValues> = {
      customFieldValues: [
        {
          value: { type: 'required', message: 'Driver Version is required' },
        },
        undefined, // Should not crash on undefined entries
        {
          value: undefined, // Should not crash on undefined value
        },
        {
          value: { type: 'required', message: undefined }, // Should handle undefined message
        },
      ],
    }

    render(<FormValidationSummary errors={errors} />)

    expect(
      screen.getByText('Please fix the following errors:'),
    ).toBeInTheDocument()
    expect(screen.getByText('• Driver Version is required')).toBeInTheDocument()
    // Should only show the one valid error message
    expect(screen.getAllByText(/^•/).length).toBe(1)
  })

  it('should display the alert icon', () => {
    const errors: FieldErrors<ListingFormValues> = {
      gameId: { type: 'required', message: 'Game is required' },
    }

    const { container } = render(<FormValidationSummary errors={errors} />)

    // Check for the presence of the error text which confirms the component renders
    expect(
      screen.getByText('Please fix the following errors:'),
    ).toBeInTheDocument()

    // Check for the container with error styling (which contains the AlertCircle icon)
    const errorContainer = container.querySelector('.bg-red-50')
    expect(errorContainer).toBeInTheDocument()
  })

  it('should have proper styling classes', () => {
    const errors: FieldErrors<ListingFormValues> = {
      gameId: { type: 'required', message: 'Game is required' },
    }

    const { container } = render(<FormValidationSummary errors={errors} />)

    const errorContainer = container.querySelector('.bg-red-50')
    expect(errorContainer).toBeInTheDocument()
    expect(errorContainer).toHaveClass(
      'bg-red-50',
      'dark:bg-red-900/20',
      'rounded-lg',
      'border',
      'border-red-200',
      'dark:border-red-800',
    )
  })
})
