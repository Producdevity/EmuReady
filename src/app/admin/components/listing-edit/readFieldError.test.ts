import { describe, expect, it } from 'vitest'
import { readFieldError } from './readFieldError'

type SampleForm = {
  gameId: string
  performance: number
  notes?: string | null
  customFieldValues: { customFieldDefinitionId: string; value?: unknown }[]
}

describe('readFieldError', () => {
  it('returns empty string when errors is empty', () => {
    expect(readFieldError<SampleForm>({}, 'gameId')).toBe('')
  })

  it('returns the message for a top-level field error', () => {
    const errors = {
      gameId: { type: 'required', message: 'Game is required' },
    }
    expect(readFieldError<SampleForm>(errors, 'gameId')).toBe('Game is required')
  })

  it('returns empty string when the field has no error', () => {
    const errors = {
      performance: { type: 'min', message: 'too low' },
    }
    expect(readFieldError<SampleForm>(errors, 'gameId')).toBe('')
  })

  it('resolves nested dotted paths (array index + field)', () => {
    const errors = {
      customFieldValues: [
        undefined,
        { value: { type: 'required', message: 'Driver version required' } },
      ],
    }
    expect(
      readFieldError<SampleForm>(
        errors as Parameters<typeof readFieldError<SampleForm>>[0],
        'customFieldValues.1.value',
      ),
    ).toBe('Driver version required')
  })

  it('returns empty string when an intermediate path segment is missing', () => {
    const errors = {}
    expect(readFieldError<SampleForm>(errors, 'customFieldValues.0.value')).toBe('')
  })

  it('coerces non-string messages via String() but returns empty for nullish', () => {
    const errors = {
      performance: { type: 'min', message: undefined },
    }
    expect(readFieldError<SampleForm>(errors, 'performance')).toBe('')
  })
})
