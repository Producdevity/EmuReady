import { z } from 'zod'

// Admin table URL parameters
export const AdminTableParamsSchema = z.object({
  search: z.string().default(''),
  page: z.number().int().positive().default(1),
  sortField: z.string().nullable().default(null),
  sortDirection: z.enum(['asc', 'desc']).nullable().default(null), // TODO: extract
})

export const JsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(JsonValueSchema),
  ]),
)

// Column visibility (array of visible column keys)
export const ColumnVisibilitySchema = z.array(z.string())

// Common filter values
export const FilterValueSchema = z.object({
  value: z.string(),
  label: z.string(),
})

export type FilterValue = z.infer<typeof FilterValueSchema>

// Listing type: handheld vs PC
export const ListingType = z.enum(['handheld', 'pc'])
export type ListingType = z.infer<typeof ListingType>

// Severity level
export const Severity = z.enum(['low', 'medium', 'high'])
export type Severity = z.infer<typeof Severity>
