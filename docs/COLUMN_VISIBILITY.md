# Column Visibility Feature

The column visibility feature allows users to show and hide columns in data tables. This feature is implemented using a reusable hook and component that can be easily added to any table.

## Components

### `useColumnVisibility` Hook

A custom hook that manages column visibility state with localStorage persistence.

```typescript
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'

const columns: ColumnDefinition[] = [
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: true },
  { key: 'role', label: 'Role', defaultVisible: false },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

const columnVisibility = useColumnVisibility(columns, {
  storageKey: 'my-table-columns-visibility', // Optional: for localStorage persistence
})
```

#### Column Definition Properties

- `key`: Unique identifier for the column
- `label`: Display name for the column
- `defaultVisible`: Whether the column is visible by default (default: `true`)
- `alwaysVisible`: Whether the column should always be visible and cannot be hidden (default: `false`)

#### Hook Options

- `storageKey`: Optional key for localStorage persistence. If provided, column visibility state will be saved and restored across sessions.

#### Hook Return Value

```typescript
interface UseColumnVisibilityReturn {
  visibleColumns: Set<string>
  isColumnVisible: (columnKey: string) => boolean
  toggleColumn: (columnKey: string) => void
  showColumn: (columnKey: string) => void
  hideColumn: (columnKey: string) => void
  resetToDefaults: () => void
  showAll: () => void
  hideAll: () => void
  isHydrated: boolean
}
```

### `ColumnVisibilityControl` Component

A dropdown component that provides UI controls for managing column visibility.

```typescript
import { ColumnVisibilityControl } from '@/components/ui'

<ColumnVisibilityControl
  columns={columns}
  columnVisibility={columnVisibility}
  className="optional-custom-class"
/>
```

## Usage Example

Here's a complete example of how to implement column visibility in a table:

```typescript
'use client'

import { ColumnVisibilityControl } from '@/components/ui'
import useColumnVisibility, { type ColumnDefinition } from '@/hooks/useColumnVisibility'

const COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: true },
  { key: 'role', label: 'Role', defaultVisible: false },
  { key: 'createdAt', label: 'Created', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function MyTablePage() {
  const columnVisibility = useColumnVisibility(COLUMNS, {
    storageKey: 'my-table-columns-visibility',
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>My Table</h1>
        <ColumnVisibilityControl
          columns={COLUMNS}
          columnVisibility={columnVisibility}
        />
      </div>

      <table>
        <thead>
          <tr>
            {columnVisibility.isColumnVisible('name') && <th>Name</th>}
            {columnVisibility.isColumnVisible('email') && <th>Email</th>}
            {columnVisibility.isColumnVisible('role') && <th>Role</th>}
            {columnVisibility.isColumnVisible('createdAt') && <th>Created</th>}
            {columnVisibility.isColumnVisible('actions') && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              {columnVisibility.isColumnVisible('name') && <td>{item.name}</td>}
              {columnVisibility.isColumnVisible('email') && <td>{item.email}</td>}
              {columnVisibility.isColumnVisible('role') && <td>{item.role}</td>}
              {columnVisibility.isColumnVisible('createdAt') && <td>{item.createdAt}</td>}
              {columnVisibility.isColumnVisible('actions') && (
                <td>
                  <button>Edit</button>
                  <button>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

## Features

- **Persistent State**: Column visibility preferences are saved to localStorage when a `storageKey` is provided
- **Always Visible Columns**: Columns marked with `alwaysVisible: true` cannot be hidden (useful for action columns)
- **Default Visibility**: Control which columns are visible by default using `defaultVisible`
- **Bulk Operations**: Show all, hide all, or reset to defaults
- **Accessible UI**: The control component includes proper ARIA labels and keyboard navigation
- **Click Outside to Close**: The dropdown automatically closes when clicking outside
- **Visual Feedback**: Shows count of visible/total columns and visual indicators for column state

## Implementation in Existing Pages

The column visibility feature has been implemented in:

- **Listings Page** (`src/app/listings/page.tsx`): Users can show/hide columns like Author, which is hidden by default

To add this feature to other admin pages, follow the pattern established in the listings page:

1. Define column definitions with appropriate `defaultVisible` and `alwaysVisible` settings
2. Use the `useColumnVisibility` hook with a unique `storageKey`
3. Add the `ColumnVisibilityControl` component to the page header
4. Wrap table headers and cells with `columnVisibility.isColumnVisible()` checks

## Testing

The feature includes comprehensive tests:

- **Hook Tests** (`src/hooks/useColumnVisibility.test.ts`): Tests all hook functionality including localStorage persistence
- **Component Tests** (`src/components/ui/ColumnVisibilityControl.test.tsx`): Tests UI interactions and accessibility
- **Integration Tests** (`src/app/listings/components/ListingsTable.test.tsx`): Tests the feature working in a table context

## Best Practices

1. **Always Visible Actions**: Mark action columns as `alwaysVisible: true` so users can't accidentally hide important controls
2. **Sensible Defaults**: Hide less important columns by default to reduce visual clutter
3. **Unique Storage Keys**: Use descriptive, unique storage keys to avoid conflicts between different tables
4. **Consistent Patterns**: Follow the same implementation pattern across all tables for consistency
5. **Performance**: The `isColumnVisible` function is optimized for frequent calls during rendering
