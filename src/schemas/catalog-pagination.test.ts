import { describe, expect, it } from 'vitest'
import { GetGamesSchema } from './game'
import { GetListingsSchema } from './listing'
import { GetPcListingsSchema } from './pcListing'

const catalogs = [
  { name: 'games', schema: GetGamesSchema, defaultLimit: 100, maxLimit: 100 },
  { name: 'handheld reports', schema: GetListingsSchema, defaultLimit: 10, maxLimit: 100 },
  { name: 'PC reports', schema: GetPcListingsSchema, defaultLimit: 10, maxLimit: 50 },
]

describe.each(catalogs)('$name pagination', (catalog) => {
  it('preserves its existing defaults', () => {
    expect(catalog.schema.parse({})).toMatchObject({ limit: catalog.defaultLimit })
  })

  it.each([0, -1, 1.5, Infinity, NaN, 1e40, Number.MAX_SAFE_INTEGER + 1])(
    'rejects the page or limit %s',
    (value) => {
      expect(catalog.schema.safeParse({ page: value }).success).toBe(false)
      expect(catalog.schema.safeParse({ limit: value }).success).toBe(false)
    },
  )

  it('accepts its maximum and rejects an excessive limit', () => {
    expect(catalog.schema.safeParse({ limit: catalog.maxLimit }).success).toBe(true)
    expect(catalog.schema.safeParse({ limit: catalog.maxLimit + 1 }).success).toBe(false)
  })
})

it('preserves an omitted games input and its optional page', () => {
  expect(GetGamesSchema.parse(undefined)).toBeUndefined()
  expect(GetGamesSchema.parse({})?.page).toBeUndefined()
  expect(GetGamesSchema.parse({})?.offset).toBe(0)
})

it.each([-1, 0.5, Infinity, NaN, 1e40, Number.MAX_SAFE_INTEGER + 1])(
  'rejects an invalid game offset %s',
  (offset) => {
    expect(GetGamesSchema.safeParse({ offset }).success).toBe(false)
  },
)
