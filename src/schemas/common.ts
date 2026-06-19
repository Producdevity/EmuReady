import { z } from 'zod'

export const SortDirectionSchema = z.enum(['asc', 'desc'])
export type SortDirection = z.output<typeof SortDirectionSchema>

export const MutationSuccessSchema = z.object({
  success: z.literal(true),
})
export type MutationSuccess = z.output<typeof MutationSuccessSchema>

export function createMutationSuccess(): MutationSuccess {
  return { success: true }
}

// Admin table URL parameters
export const AdminTableParamsSchema = z.object({
  search: z.string().default(''),
  page: z.number().int().positive().default(1),
  sortField: z.string().nullable().default(null),
  sortDirection: SortDirectionSchema.nullable().default(null),
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

export type FilterValue = z.output<typeof FilterValueSchema>

// Listing type: handheld vs PC
export const ListingType = z.enum(['handheld', 'pc'])
export type ListingType = z.output<typeof ListingType>

// Severity level
export const Severity = z.enum(['low', 'medium', 'high'])
export type Severity = z.output<typeof Severity>
