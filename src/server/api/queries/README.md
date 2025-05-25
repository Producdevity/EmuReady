# Query Organization

This directory contains all Prisma query fragments and helpers organized by domain/entity. This structure provides better maintainability and scalability compared to having everything in monolithic files.

## Structure

```
queries/
├── index.ts              # Main exports with domain namespaces
├── users/
│   ├── index.ts          # Re-exports fragments + helpers
│   ├── fragments.ts      # User-related query fragments
│   └── helpers.ts        # User-related query helpers
├── listings/
│   ├── index.ts
│   ├── fragments.ts      # Listing-related query fragments
│   └── helpers.ts        # Listing-related query helpers
├── comments/
│   ├── index.ts
│   ├── fragments.ts      # Comment-related query fragments
│   └── helpers.ts        # Comment-related query helpers
├── games/
│   ├── index.ts
│   └── fragments.ts      # Game-related query fragments
├── devices/
│   ├── index.ts
│   └── fragments.ts      # Device-related query fragments
├── emulators/
│   ├── index.ts
│   └── fragments.ts      # Emulator-related query fragments
├── systems/
│   ├── index.ts
│   └── fragments.ts      # System-related query fragments
├── performance/
│   ├── index.ts
│   └── fragments.ts      # Performance-related query fragments
└── votes/
    ├── index.ts
    └── fragments.ts      # Vote-related query fragments
```

## Usage Patterns

### Option 1: Domain-Namespaced Imports (Recommended)

```typescript
import { UserQueries, ListingQueries } from '../queries'

// Use with namespace
const user = await UserQueries.getUserProfile(userId)
const listing = await ListingQueries.getListingWithStats(listingId)

// Use fragments with namespace
const users = await prisma.user.findMany({
  select: UserQueries.userBasicSelect,
})
```

### Option 2: Direct Imports (For Commonly Used Items)

```typescript
import {
  getUserProfile,
  getListingWithStats,
  userBasicSelect,
} from '../queries'

// Use directly
const user = await getUserProfile(userId)
const listing = await getListingWithStats(listingId)
```

### Option 3: Specific Domain Imports

```typescript
import { getUserProfile, userBasicSelect } from '../queries/users'
import { getListingWithStats } from '../queries/listings'
```

## Benefits

1. **Domain Separation**: Each entity has its own query logic
2. **Scalability**: Easy to add new domains without cluttering existing files
3. **Maintainability**: Changes to one domain don't affect others
4. **Discoverability**: Clear organization makes it easy to find relevant queries
5. **Type Safety**: All fragments use `satisfies` for type checking
6. **Flexibility**: Multiple import patterns to suit different preferences

## Adding New Domains

1. Create a new directory: `queries/new-domain/`
2. Add `fragments.ts` with query fragments
3. Add `helpers.ts` if you need query helpers
4. Add `index.ts` that re-exports everything
5. Update the main `queries/index.ts` to export the new domain

## Migration from Old Structure

The old `query-fragments.ts` and `query-helpers.ts` files have been replaced by this domain-organized structure. All existing functionality is preserved but better organized.

### Before:

```typescript
import { userBasicSelect, listingBasicInclude } from '../query-fragments'
import { getUserProfile, getListingWithStats } from '../query-helpers'
```

### After:

```typescript
import {
  userBasicSelect,
  getUserProfile,
  getListingWithStats,
} from '../queries'
```

## Best Practices

1. **Keep fragments focused**: Each fragment should serve a specific use case
2. **Use descriptive names**: Make it clear what data the fragment includes
3. **Leverage composition**: Build complex fragments from simpler ones
4. **Document complex helpers**: Add comments for non-obvious query logic
5. **Use TypeScript**: Always use `satisfies` for type safety
