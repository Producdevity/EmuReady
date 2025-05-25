# Query Improvement Example

## Before: Verbose and Repetitive

The original `getProfile` method in `users.ts` was 50+ lines of nested select objects:

```typescript
getProfile: protectedProcedure.query(async ({ ctx }) => {
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      role: true,
      createdAt: true,
      listings: {
        select: {
          id: true,
          createdAt: true,
          device: {
            select: {
              brand: { select: { id: true, name: true } },
              modelName: true,
            },
          },
          game: { select: { title: true } },
          emulator: { select: { name: true } },
          performance: { select: { label: true } },
        },
      },
      votes: {
        select: {
          id: true,
          value: true,
          listing: {
            select: {
              id: true,
              device: {
                select: {
                  brand: {
                    select: { id: true, name: true },
                  },
                  modelName: true,
                },
              },
              game: { select: { title: true } },
              emulator: { select: { name: true } },
              performance: { select: { label: true } },
            },
          },
        },
      },
    },
  })

  if (!user) ResourceError.user.notFound()
  return user
}),
```

## After: Clean and Reusable

Now it's just 6 lines:

```typescript
getProfile: protectedProcedure.query(async ({ ctx }) => {
  const user = await getUserProfile(ctx.session.user.id)

  if (!user) ResourceError.user.notFound()

  return user
}),
```

## Benefits

1. **Reduced Duplication**: Common query patterns are defined once in `query-fragments.ts`
2. **Better Maintainability**: Changes to query structure only need to be made in one place
3. **Type Safety**: All fragments use `satisfies` to ensure type correctness
4. **Readability**: Router code focuses on business logic, not query structure
5. **Consistency**: All similar queries use the same fragments
6. **Performance**: Helper functions can optimize queries (like batching vote calculations)

## Key Files

- `src/server/api/queries/` - Domain-organized query fragments and helpers
  - `users/` - User-related queries
  - `listings/` - Listing-related queries
  - `comments/` - Comment-related queries
  - `games/`, `devices/`, `emulators/`, etc. - Other domain queries
- `src/server/api/queries/index.ts` - Main exports with clean API
- Updated routers now use the domain-organized query structure

## Examples of Improvements

### Users Router

- `getProfile`: 50+ lines → 6 lines
- `getUserById`: 50+ lines → 8 lines
- `getAll`: Uses `userBasicSelect` fragment

### Listings Router

- `byId`: 80+ lines → 12 lines
- `getComments`: 35+ lines → 6 lines

### Other Routers

- Systems, Emulators, Devices all use appropriate fragments
- Consistent query patterns across the entire codebase

## New Domain-Organized Structure

The queries are now organized by domain for better scalability:

```typescript
// Option 1: Domain-namespaced imports (recommended for large scale)
import { UserQueries, ListingQueries } from '../queries'

const user = await UserQueries.getUserProfile(userId)
const listing = await ListingQueries.getListingWithStats(listingId)

// Option 2: Direct imports (for commonly used items)
import { getUserProfile, getListingWithStats } from '../queries'

// Option 3: Specific domain imports
import { getUserProfile } from '../queries/users'
import { getListingWithStats } from '../queries/listings'
```

This domain-organized approach scales much better as the application grows and makes the codebase significantly more maintainable. Each domain can evolve independently without affecting others.
