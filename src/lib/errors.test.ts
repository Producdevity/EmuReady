import { TRPCError } from '@trpc/server'
import { describe, it, expect } from 'vitest'
import { AppError, ResourceError, ValidationError, ERROR_CODES } from './errors'

describe('Error Handling System', () => {
  describe('AppError', () => {
    describe('Authentication & Authorization', () => {
      it('should throw unauthorized error with default message', () => {
        expect(() => AppError.unauthorized()).toThrow(TRPCError)
        expect(() => AppError.unauthorized()).toThrow(
          'You must be logged in to perform this action',
        )
      })

      it('should throw unauthorized error with custom message', () => {
        expect(() => AppError.unauthorized('Custom message')).toThrow('Custom message')
      })

      it('should throw forbidden error with default message', () => {
        expect(() => AppError.forbidden()).toThrow(
          'You do not have permission to perform this action',
        )
      })

      it('should throw insufficient permissions error with role', () => {
        expect(() => AppError.insufficientPermissions('ADMIN')).toThrow(
          'You need Admin permissions to perform this action',
        )
      })
    })

    describe('Resource Errors', () => {
      it('should throw not found error with resource name', () => {
        expect(() => AppError.notFound('User')).toThrow('User not found')
      })

      it('should throw not found error with default message', () => {
        expect(() => AppError.notFound()).toThrow('The requested resource was not found')
      })

      it('should throw already exists error with resource and identifier', () => {
        expect(() => AppError.alreadyExists('User', 'email "test@example.com"')).toThrow(
          'User with email "test@example.com" already exists',
        )
      })

      it('should throw conflict error with custom message', () => {
        expect(() => AppError.conflict('Custom conflict message')).toThrow(
          'Custom conflict message',
        )
      })
    })

    describe('Validation Errors', () => {
      it('should throw bad request error with default message', () => {
        expect(() => AppError.badRequest()).toThrow('The provided input is invalid')
      })

      it('should throw invalid input error with field name', () => {
        expect(() => AppError.invalidInput('email')).toThrow('Invalid input for field: email')
      })

      it('should throw missing required field error', () => {
        expect(() => AppError.missingRequiredField('name')).toThrow('Required field missing: name')
      })
    })

    describe('Business Logic Errors', () => {
      it('should throw resource in use error with count', () => {
        expect(() => AppError.resourceInUse('user', 5)).toThrow(
          'Cannot delete user that is used in 5 records',
        )
      })

      it('should throw resource in use error without count', () => {
        expect(() => AppError.resourceInUse('user')).toThrow(
          'Cannot delete user as it is currently in use',
        )
      })

      it('should throw operation not allowed error', () => {
        expect(() => AppError.operationNotAllowed('delete')).toThrow(
          'Operation not allowed: delete',
        )
      })
    })

    describe('System Errors', () => {
      it('should throw internal error with default message', () => {
        expect(() => AppError.internalError()).toThrow('An internal server error occurred')
      })

      it('should throw database error with operation', () => {
        expect(() => AppError.databaseError('user creation')).toThrow(
          'Database error during user creation',
        )
      })
    })

    describe('Custom Errors', () => {
      it('should throw custom error with specified code and message', () => {
        expect(() => AppError.custom('BAD_REQUEST', 'Custom error message')).toThrow(
          'Custom error message',
        )
      })
    })
  })

  describe('ValidationError', () => {
    it('should throw requires options error', () => {
      expect(() => ValidationError.requiresOptions('SELECT')).toThrow(
        'Options are required for SELECT type custom fields',
      )
    })

    it('should throw options not allowed error', () => {
      expect(() => ValidationError.optionsNotAllowed('TEXT')).toThrow(
        'Options can only be provided for SELECT type custom fields, not TEXT',
      )
    })

    it('should throw empty options error', () => {
      expect(() => ValidationError.emptyOptions('SELECT')).toThrow(
        'Options list cannot be empty for SELECT type. Provide at least one option',
      )
    })

    it('should throw invalid options error', () => {
      expect(() => ValidationError.invalidOptions('SELECT')).toThrow(
        'Existing options are invalid or empty for SELECT type. Please provide new options',
      )
    })
  })

  describe('ResourceError', () => {
    describe('deviceBrand', () => {
      it('should throw device brand not found error', () => {
        expect(() => ResourceError.deviceBrand.notFound()).toThrow('Device brand not found')
      })

      it('should throw device brand already exists error', () => {
        expect(() => ResourceError.deviceBrand.alreadyExists('Apple')).toThrow(
          'Brand with "Apple" already exists',
        )
      })

      it('should throw device brand in use error', () => {
        expect(() => ResourceError.deviceBrand.inUse(3)).toThrow(
          'Cannot delete brand that is used in 3 records',
        )
      })
    })

    describe('device', () => {
      it('should throw device not found error', () => {
        expect(() => ResourceError.device.notFound()).toThrow('Device not found')
      })

      it('should throw device already exists error', () => {
        expect(() => ResourceError.device.alreadyExists('iPhone 15')).toThrow(
          'A device with model name "iPhone 15" already exists for this brand',
        )
      })

      it('should throw device in use error', () => {
        expect(() => ResourceError.device.inUse(2)).toThrow(
          'Cannot delete device that is used in 2 records',
        )
      })
    })

    describe('system', () => {
      it('should throw system not found error', () => {
        expect(() => ResourceError.system.notFound()).toThrow('System not found')
      })

      it('should throw system already exists error', () => {
        expect(() => ResourceError.system.alreadyExists('Nintendo Switch')).toThrow(
          'System with name "Nintendo Switch" already exists',
        )
      })

      it('should throw system has games error', () => {
        expect(() => ResourceError.system.hasGames(10)).toThrow(
          'Cannot delete system that is used in 10 records',
        )
      })
    })

    describe('listing', () => {
      it('should throw listing not found error', () => {
        expect(() => ResourceError.listing.notFound()).toThrow('Listing not found')
      })

      it('should throw listing already exists error', () => {
        expect(() => ResourceError.listing.alreadyExists()).toThrow(
          'A listing for this game, device, and emulator combination already exists',
        )
      })

      it('should throw listing not pending error', () => {
        expect(() => ResourceError.listing.notPending()).toThrow(
          'Pending listing not found or already processed',
        )
      })
    })

    describe('customField', () => {
      it('should throw custom field not found error', () => {
        expect(() => ResourceError.customField.notFound()).toThrow('Custom field not found')
      })

      it('should throw custom field already exists error', () => {
        expect(() => ResourceError.customField.alreadyExists('driver_version')).toThrow(
          'A custom field with name "driver_version" already exists for this emulator',
        )
      })

      it('should throw invalid custom field for emulator error', () => {
        expect(() =>
          ResourceError.customField.invalidForEmulator('field-123', 'emulator-456'),
        ).toThrow('Invalid custom field definition ID: field-123 for emulator emulator-456')
      })
    })

    describe('user', () => {
      it('should throw user not found error', () => {
        expect(() => ResourceError.user.notFound()).toThrow('User not found')
      })

      it('should throw user email exists error', () => {
        expect(() => ResourceError.user.emailExists()).toThrow(
          'User with this email already exists',
        )
      })

      it('should throw invalid password error', () => {
        expect(() => ResourceError.user.invalidPassword()).toThrow('Current password is incorrect')
      })

      it('should throw cannot delete self error', () => {
        expect(() => ResourceError.user.cannotDeleteSelf()).toThrow(
          'You cannot delete your own account',
        )
      })

      it('should throw cannot demote self error', () => {
        expect(() => ResourceError.user.cannotDemoteSelf()).toThrow(
          'You cannot demote yourself from the admin role',
        )
      })

      it('should throw user not in database error', () => {
        expect(() => ResourceError.user.notInDatabase('user-123')).toThrow(
          'User with ID user-123 not found in database',
        )
      })
    })

    describe('comment', () => {
      it('should throw comment not found error', () => {
        expect(() => ResourceError.comment.notFound()).toThrow('Comment not found')
      })

      it('should throw parent comment not found error', () => {
        expect(() => ResourceError.comment.parentNotFound()).toThrow('Parent comment not found')
      })

      it('should throw comment already deleted error', () => {
        expect(() => ResourceError.comment.alreadyDeleted()).toThrow('Comment is already deleted')
      })

      it('should throw cannot edit deleted comment error', () => {
        expect(() => ResourceError.comment.cannotEditDeleted()).toThrow(
          'Cannot edit a deleted comment',
        )
      })
    })
  })

  describe('Error Codes', () => {
    it('should have correct error code constants', () => {
      expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED')
      expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN')
      expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND')
      expect(ERROR_CODES.CONFLICT).toBe('CONFLICT')
      expect(ERROR_CODES.BAD_REQUEST).toBe('BAD_REQUEST')
      expect(ERROR_CODES.INTERNAL_SERVER_ERROR).toBe('INTERNAL_SERVER_ERROR')
    })
  })

  describe('TRPCError Integration', () => {
    it('should throw TRPCError instances with correct codes', () => {
      try {
        AppError.unauthorized()
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('UNAUTHORIZED')
      }

      try {
        AppError.notFound('Resource')
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('NOT_FOUND')
      }

      try {
        AppError.conflict('Conflict message')
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('CONFLICT')
      }
    })
  })
})
