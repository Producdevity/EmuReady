# Error Handling System

This document describes the centralized error handling system for the EmuReady application, which provides type-safe, consistent error throwing for TRPC procedures.

## Overview

The error handling system replaces the previous pattern of manually throwing `TRPCError` instances throughout the codebase with a more maintainable, type-safe approach.

### Before (❌ Not Recommended)

```typescript
// Old pattern - error-prone and inconsistent
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Device brand not found',
})

throw new TRPCError({
  code: 'CONFLICT',
  message: `Brand "${input.name}" already exists`,
})
```

### After (✅ Recommended)

```typescript
// New pattern - type-safe and consistent
import { ResourceError } from '@/lib/errors'

ResourceError.deviceBrand.notFound()
ResourceError.deviceBrand.alreadyExists(input.name)
```

## Benefits

1. **Type Safety**: Error codes are constants, not strings
2. **Consistency**: Standardized error messages across the application
3. **Maintainability**: Centralized error handling logic
4. **Developer Experience**: Autocomplete and IntelliSense support
5. **Testability**: Easy to test error scenarios

## Core Classes

### `AppError`

General-purpose error methods for common scenarios.

```typescript
import { AppError } from '@/lib/errors'

// Authentication & Authorization
AppError.unauthorized()
AppError.forbidden()
AppError.insufficientPermissions('ADMIN')

// Resource errors
AppError.notFound('User')
AppError.alreadyExists('User', 'email "test@example.com"')
AppError.conflict('Custom conflict message')

// Validation errors
AppError.badRequest('Invalid input')
AppError.invalidInput('email')
AppError.missingRequiredField('name')

// Business logic errors
AppError.resourceInUse('user', 5)
AppError.operationNotAllowed('delete')

// System errors
AppError.internalError()
AppError.databaseError('user creation')

// Custom errors
AppError.custom('BAD_REQUEST', 'Custom message')
```

### `ResourceError`

Resource-specific error methods with contextual messages.

```typescript
import { ResourceError } from '@/lib/errors'

// Device Brands
ResourceError.deviceBrand.notFound()
ResourceError.deviceBrand.alreadyExists('Apple')
ResourceError.deviceBrand.inUse(3)

// Devices
ResourceError.device.notFound()
ResourceError.device.alreadyExists('iPhone 15')
ResourceError.device.inUse(2)

// Systems
ResourceError.system.notFound()
ResourceError.system.alreadyExists('Nintendo Switch')
ResourceError.system.hasGames(10)

// Games
ResourceError.game.notFound()
ResourceError.game.inUse(5)

// Emulators
ResourceError.emulator.notFound()
ResourceError.emulator.alreadyExists('Dolphin')
ResourceError.emulator.inUse(8)

// Listings
ResourceError.listing.notFound()
ResourceError.listing.alreadyExists()
ResourceError.listing.notPending()

// Custom Fields
ResourceError.customField.notFound()
ResourceError.customField.alreadyExists('driver_version')
ResourceError.customField.invalidForEmulator('field-123', 'emulator-456')

// Performance Scales
ResourceError.performanceScale.notFound()
ResourceError.performanceScale.labelExists('Excellent')
ResourceError.performanceScale.rankExists(1)
ResourceError.performanceScale.inUse(15)

// Users
ResourceError.user.notFound()
ResourceError.user.emailExists()
ResourceError.user.invalidPassword()
ResourceError.user.cannotDeleteSelf()
ResourceError.user.cannotDemoteSelf()
ResourceError.user.notInDatabase('user-123')

// Comments
ResourceError.comment.notFound()
ResourceError.comment.parentNotFound()
ResourceError.comment.alreadyDeleted()
ResourceError.comment.cannotEditDeleted()
```

### `ValidationError`

Specialized validation errors for custom fields and form validation.

```typescript
import { ValidationError } from '@/lib/errors'

ValidationError.requiresOptions('SELECT')
ValidationError.optionsNotAllowed('TEXT')
ValidationError.emptyOptions('SELECT')
ValidationError.invalidOptions('SELECT')
```

## Migration Guide

### Step 1: Import the Error Classes

```typescript
// Replace TRPCError import
- import { TRPCError } from '@trpc/server'

// Add error handling imports
+ import { AppError, ResourceError } from '@/lib/errors'
```

### Step 2: Replace Error Throwing Patterns

#### Not Found Errors

```typescript
// Before
- if (!user) {
-   throw new TRPCError({
-     code: 'NOT_FOUND',
-     message: 'User not found',
-   })
- }

// After
+ if (!user) {
+   ResourceError.user.notFound()
+ }
```

#### Already Exists Errors

```typescript
// Before
- if (existingUser) {
-   throw new TRPCError({
-     code: 'CONFLICT',
-     message: `User with email "${email}" already exists`,
-   })
- }

// After
+ if (existingUser) {
+   ResourceError.user.emailExists()
+ }
```

#### Permission Errors

```typescript
// Before
- if (!hasPermission(user.role, Role.ADMIN)) {
-   throw new TRPCError({
-     code: 'FORBIDDEN',
-     message: 'You need admin permissions',
-   })
- }

// After
+ if (!hasPermission(user.role, Role.ADMIN)) {
+   AppError.insufficientPermissions('ADMIN')
+ }
```

#### Resource In Use Errors

```typescript
// Before
- if (listingsCount > 0) {
-   throw new TRPCError({
-     code: 'BAD_REQUEST',
-     message: `Cannot delete device that is used in ${listingsCount} listings`,
-   })
- }

// After
+ if (listingsCount > 0) {
+   ResourceError.device.inUse(listingsCount)
+ }
```

## Error Codes

The system uses type-safe error codes defined as constants:

```typescript
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const
```

## Adding New Error Types

### Adding a New Resource Error

```typescript
// In src/lib/errors.ts
export class ResourceError {
  // ... existing resources ...

  static newResource = {
    notFound: () => AppError.notFound('New Resource'),
    alreadyExists: (name: string) =>
      AppError.alreadyExists('New Resource', `name "${name}"`),
    inUse: (count: number) => AppError.resourceInUse('new resource', count),
  }
}
```

### Adding a New General Error

```typescript
// In src/lib/errors.ts
export class AppError {
  // ... existing methods ...

  static newErrorType(customParam?: string): never {
    const message = customParam
      ? `Custom error with ${customParam}`
      : 'Default custom error message'

    throw new TRPCError({
      code: ERROR_CODES.BAD_REQUEST,
      message,
    })
  }
}
```

## Testing Error Handling

The error handling system is fully testable:

```typescript
import { describe, it, expect } from 'vitest'
import { ResourceError } from '@/lib/errors'

describe('My Router', () => {
  it('should throw not found error for missing user', () => {
    expect(() => ResourceError.user.notFound()).toThrow('User not found')
  })
})
```

## Best Practices

1. **Use Specific Resource Errors**: Prefer `ResourceError.user.notFound()` over `AppError.notFound('User')`
2. **Provide Context**: Include relevant identifiers in error messages when available
3. **Be Consistent**: Use the same error type for the same scenario across different routers
4. **Test Error Scenarios**: Write tests for both success and error cases
5. **Document Custom Errors**: If you add new error types, document them in this file

## Error Message Consistency

The system ensures consistent error messages across the application:

- **Not Found**: `"{Resource} not found"`
- **Already Exists**: `"{Resource} with {identifier} already exists"`
- **In Use**: `"Cannot delete {resource} that is used in {count} records"`
- **Unauthorized**: `"You must be logged in to perform this action"`
- **Forbidden**: `"You do not have permission to perform this action"`

## Integration with TRPC

All error methods throw `TRPCError` instances with the appropriate HTTP status codes:

- `UNAUTHORIZED` → 401
- `FORBIDDEN` → 403
- `NOT_FOUND` → 404
- `CONFLICT` → 409
- `BAD_REQUEST` → 400
- `INTERNAL_SERVER_ERROR` → 500

The errors are automatically handled by TRPC and sent to the client with proper HTTP status codes and error messages.
