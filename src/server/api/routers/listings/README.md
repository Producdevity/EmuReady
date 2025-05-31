# Listings Router Module (this might be overkill)

This directory contains the modular implementation of the listings router, broken down into focused, maintainable modules.

## Structure

### Core Modules

- **`core.ts`** - Core listing operations (CRUD, voting, performance scales)
- **`comments.ts`** - Comment-related operations (create, edit, delete, vote)
- **`admin.ts`** - Admin-specific operations (approve, reject, delete)
- **`validation.ts`** - Custom field validation logic

### Supporting Files

- **`index.ts`** - Exports all modules for easy importing
- **`README.md`** - This documentation file

## Module Responsibilities

### Core Router (`core.ts`)

- `get` - Fetch listings with filtering, sorting, and pagination
- `byId` - Fetch a single listing by ID
- `create` - Create new listings with custom field validation
- `vote` - Vote on listings (upvote/downvote)
- `performanceScales` - Fetch performance scale options

### Comments Router (`comments.ts`)

- `create` - Create new comments and replies
- `get` - Fetch comments for a listing
- `getSorted` - Fetch comments with different sorting options
- `edit` - Edit existing comments (with permission checks)
- `delete` - Soft delete comments (with permission checks)
- `vote` - Vote on comments (upvote/downvote)

### Admin Router (`admin.ts`)

- `getPending` - Fetch pending listings for approval
- `approve` - Approve pending listings
- `reject` - Reject pending listings with notes
- `getProcessed` - Fetch processed listings (super admin only)
- `overrideStatus` - Override listing approval status (super admin only)
- `delete` - Hard delete listings

### Validation Module (`validation.ts`)

- `validateCustomFields` - Validates required custom fields based on emulator
- `validateFieldValue` - Validates individual field values based on type

## Benefits of This Structure

1. **Separation of Concerns** - Each module has a clear, focused responsibility
2. **Maintainability** - Easier to find and modify specific functionality
3. **Testability** - Individual modules can be tested in isolation
4. **Reusability** - Validation logic can be reused across different contexts
5. **Readability** - Smaller files are easier to understand and navigate

## Usage

The main listings router (`../listings.ts`) combines all these modules:

```typescript
import { createTRPCRouter } from '@/server/api/trpc'
import { coreRouter } from './listings/core'
import { commentsRouter } from './listings/comments'
import { adminRouter } from './listings/admin'

export const listingsRouter = createTRPCRouter({
  // Core operations
  ...coreRouter._def.procedures,

  // Comment operations
  createComment: commentsRouter.create,
  // ... other comment procedures

  // Admin operations
  getPending: adminRouter.getPending,
  // ... other admin procedures
})
```

## Testing

Each module can be tested independently. See `../listings.test.ts` for examples of testing the core router with mocked dependencies.

## Future Improvements

- Consider extracting common database operations into shared utilities
- Add more granular permission checks
- Implement caching for frequently accessed data
- Add metrics and logging for better observability
