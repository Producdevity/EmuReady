import { describe, it, expect, vi, beforeEach } from 'vitest'
import toast from '@/lib/toast'
import {
  showCrudSuccess,
  showCrudError,
  createMutationErrorHandler,
  withErrorHandling,
  type EntityType,
} from './errorHandling'

// Mock the toast library
vi.mock('@/lib/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock getErrorMessage utility
vi.mock('@/utils/getErrorMessage', () => ({
  default: vi.fn((error: unknown) => {
    if (error instanceof Error) {
      return error.message
    }
    return String(error)
  }),
}))

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('showCrudSuccess', () => {
    it('should show success message for create operation', () => {
      showCrudSuccess({ entity: 'emulator', operation: 'create' })
      expect(toast.success).toHaveBeenCalledWith(
        'Emulator created successfully',
      )
    })

    it('should show success message for update operation', () => {
      showCrudSuccess({ entity: 'game', operation: 'update' })
      expect(toast.success).toHaveBeenCalledWith('Game updated successfully')
    })

    it('should show success message for delete operation', () => {
      showCrudSuccess({ entity: 'deviceBrand', operation: 'delete' })
      expect(toast.success).toHaveBeenCalledWith(
        'Device Brand deleted successfully',
      )
    })

    it('should show success message for fetch operation', () => {
      showCrudSuccess({ entity: 'user', operation: 'fetch' })
      expect(toast.success).toHaveBeenCalledWith('User loaded successfully')
    })

    it('should handle all entity types correctly', () => {
      const entities: EntityType[] = [
        'deviceBrand',
        'device',
        'system',
        'game',
        'emulator',
        'listing',
        'customField',
        'customFieldTemplate',
        'performanceScale',
        'user',
        'comment',
      ]

      entities.forEach((entity) => {
        showCrudSuccess({ entity, operation: 'create' })
        expect(toast.success).toHaveBeenCalled()
      })
    })
  })

  describe('showCrudError', () => {
    it('should show user-friendly error directly', () => {
      const userFriendlyError = new Error('User with this email already exists')
      showCrudError(userFriendlyError, { entity: 'user', operation: 'create' })

      expect(toast.error).toHaveBeenCalledWith(
        'User with this email already exists',
      )
    })

    it('should show generic message for technical errors', () => {
      const technicalError = new Error('Database connection failed')
      showCrudError(technicalError, { entity: 'emulator', operation: 'update' })

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to update emulator. Please try again.',
      )
    })

    it('should include additional context in generic messages', () => {
      const technicalError = new Error('Prisma timeout')
      showCrudError(technicalError, {
        entity: 'game',
        operation: 'delete',
        additionalContext: 'with dependencies',
      })

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to delete game with dependencies. Please try again.',
      )
    })

    it('should detect technical error patterns', () => {
      const technicalErrors = [
        'Database connection failed',
        'Prisma client error',
        'SQL syntax error',
        'Connection timeout',
        'Internal server error',
        'Unexpected error occurred',
        'Stack trace: Error at line 123',
        'Error code: 500',
        'Fetch failed: network error',
        'Network error: timeout',
      ]

      technicalErrors.forEach((errorMessage) => {
        const error = new Error(errorMessage)
        showCrudError(error, { entity: 'user', operation: 'create' })
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to create user. Please try again.',
        )
      })
    })

    it('should show user-friendly errors directly', () => {
      const userFriendlyErrors = [
        'You do not have permission to perform this action',
        'This email is already in use',
        'Invalid input provided',
        'The requested item was not found',
        'Please fill in all required fields',
      ]

      userFriendlyErrors.forEach((errorMessage) => {
        const error = new Error(errorMessage)
        showCrudError(error, { entity: 'user', operation: 'create' })
        expect(toast.error).toHaveBeenCalledWith(errorMessage)
      })
    })
  })

  describe('createMutationErrorHandler', () => {
    it('should create error handler that shows error and logs', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Test error')

      const handler = createMutationErrorHandler({
        entity: 'emulator',
        operation: 'create',
      })

      handler(error)

      expect(toast.error).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error createing emulator:',
        error,
      )

      consoleSpy.mockRestore()
    })
  })

  describe('withErrorHandling', () => {
    it('should handle successful operations and show success for create/update/delete', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      const wrappedFn = withErrorHandling(mockFn, {
        entity: 'game',
        operation: 'create',
      })

      const result = await wrappedFn('arg1', 'arg2')

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
      expect(toast.success).toHaveBeenCalledWith('Game created successfully')
    })

    it('should not show success toast for fetch operations', async () => {
      const mockFn = vi.fn().mockResolvedValue('data')
      const wrappedFn = withErrorHandling(mockFn, {
        entity: 'user',
        operation: 'fetch',
      })

      const result = await wrappedFn()

      expect(result).toBe('data')
      expect(toast.success).not.toHaveBeenCalled()
    })

    it('should handle errors and return undefined', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Test error')
      const mockFn = vi.fn().mockRejectedValue(error)
      const wrappedFn = withErrorHandling(mockFn, {
        entity: 'emulator',
        operation: 'delete',
      })

      const result = await wrappedFn()

      expect(result).toBeUndefined()
      expect(toast.error).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error deleteing emulator:',
        error,
      )

      consoleSpy.mockRestore()
    })

    it('should preserve function arguments', async () => {
      const mockFn = vi.fn().mockResolvedValue('result')
      const wrappedFn = withErrorHandling(mockFn, {
        entity: 'system',
        operation: 'update',
      })

      await wrappedFn(1, 'test', { key: 'value' })

      expect(mockFn).toHaveBeenCalledWith(1, 'test', { key: 'value' })
    })
  })
})
