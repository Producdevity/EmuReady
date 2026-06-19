import { describe, expect, it, vi } from 'vitest'
import {
  buildCpuListQuery,
  buildCpuModelNameConflictWhere,
  buildCpuOptionsQuery,
  buildCpuOrderBy,
  buildCpuWhere,
  buildMobileCpuListQuery,
  buildMobilePcListingCpuQuery,
} from './cpu.query'
import type * as OrmClient from '@orm/client'

vi.mock('@orm/client', async () => {
  const actual = await vi.importActual<typeof OrmClient>('@orm/client')
  return {
    ...actual,
    Prisma: {
      ...actual.Prisma,
      QueryMode: { insensitive: 'insensitive' },
      SortOrder: { asc: 'asc', desc: 'desc' },
    },
  }
})

const BRAND_ID = '00000000-0000-4000-a000-000000000002'
const CPU_ID = '00000000-0000-4000-a000-000000000001'

describe('cpu.query', () => {
  it('builds the shared CPU search predicate for model, brand, and combined brand-model terms', () => {
    expect(buildCpuWhere(' Intel Core i7 ', BRAND_ID)).toEqual({
      brandId: BRAND_ID,
      OR: [
        { modelName: { equals: 'Intel Core i7', mode: 'insensitive' } },
        { brand: { name: { equals: 'Intel Core i7', mode: 'insensitive' } } },
        { modelName: { contains: 'Intel Core i7', mode: 'insensitive' } },
        { brand: { name: { contains: 'Intel Core i7', mode: 'insensitive' } } },
        {
          AND: [
            { brand: { name: { contains: 'Intel', mode: 'insensitive' } } },
            { modelName: { contains: 'Core i7', mode: 'insensitive' } },
          ],
        },
      ],
    })
  })

  it('builds stable CPU ordering with explicit defaults', () => {
    expect(buildCpuOrderBy()).toEqual([{ brand: { name: 'asc' } }, { modelName: 'asc' }])
    expect(buildCpuOrderBy('pcListings', 'desc')).toEqual([{ pcListings: { _count: 'desc' } }])
  })

  it('builds paginated list query primitives', () => {
    expect(buildCpuListQuery({ page: 3, limit: 25, sortField: 'modelName' })).toEqual({
      where: {},
      orderBy: [{ modelName: 'asc' }],
      pagination: {
        limit: 25,
        offset: 50,
        page: 3,
      },
    })
  })

  it('builds CPU dropdown query primitives with lookahead pagination', () => {
    expect(buildCpuOptionsQuery({ search: 'Ryzen', offset: 10, limit: 5 })).toEqual({
      where: {
        OR: [
          { modelName: { equals: 'Ryzen', mode: 'insensitive' } },
          { brand: { name: { equals: 'Ryzen', mode: 'insensitive' } } },
          { modelName: { contains: 'Ryzen', mode: 'insensitive' } },
          { brand: { name: { contains: 'Ryzen', mode: 'insensitive' } } },
        ],
      },
      orderBy: [{ brand: { name: 'asc' } }, { modelName: 'asc' }],
      limit: 5,
      offset: 10,
    })
  })

  it('builds mobile CPU list query primitives with the old search behavior', () => {
    expect(buildMobileCpuListQuery({ search: 'Intel Core i7', page: 2, limit: 1000 })).toEqual({
      where: {
        OR: [
          { modelName: { equals: 'Intel Core i7', mode: 'insensitive' } },
          { brand: { name: { equals: 'Intel Core i7', mode: 'insensitive' } } },
          { modelName: { contains: 'Intel Core i7', mode: 'insensitive' } },
          { brand: { name: { contains: 'Intel Core i7', mode: 'insensitive' } } },
          {
            AND: [
              { brand: { name: { contains: 'Intel', mode: 'insensitive' } } },
              { modelName: { contains: 'Core i7', mode: 'insensitive' } },
            ],
          },
        ],
      },
      orderBy: [{ brand: { name: 'asc' } }, { modelName: 'asc' }],
      pagination: {
        limit: 1000,
        offset: 1000,
        page: 2,
      },
    })
  })

  it('builds mobile PC listing CPU query primitives with the old simple search behavior', () => {
    expect(
      buildMobilePcListingCpuQuery({ search: 'Ryzen', brandId: BRAND_ID, limit: 100 }),
    ).toEqual({
      where: {
        brandId: BRAND_ID,
        OR: [
          { modelName: { contains: 'Ryzen', mode: 'insensitive' } },
          { brand: { name: { contains: 'Ryzen', mode: 'insensitive' } } },
        ],
      },
      orderBy: { modelName: 'asc' },
      limit: 100,
    })
  })

  it('builds case-insensitive model conflict predicates', () => {
    expect(
      buildCpuModelNameConflictWhere({
        brandId: BRAND_ID,
        modelName: 'Core i7-13700K',
        excludeId: CPU_ID,
      }),
    ).toEqual({
      brandId: BRAND_ID,
      modelName: { equals: 'Core i7-13700K', mode: 'insensitive' },
      id: { not: CPU_ID },
    })
  })
})
