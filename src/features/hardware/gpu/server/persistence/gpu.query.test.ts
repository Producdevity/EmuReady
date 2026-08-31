import { describe, expect, it, vi } from 'vitest'
import {
  buildGpuListQuery,
  buildGpuModelNameConflictWhere,
  buildGpuOptionsQuery,
  buildGpuOrderBy,
  buildGpuWhere,
  buildMobileGpuListQuery,
  buildMobilePcListingGpuQuery,
} from './gpu.query'
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
const GPU_ID = '00000000-0000-4000-a000-000000000001'

describe('gpu.query', () => {
  it('builds the shared GPU search predicate for model, brand, and combined brand-model terms', () => {
    expect(buildGpuWhere(' NVIDIA RTX 4090 ', BRAND_ID)).toEqual({
      brandId: BRAND_ID,
      OR: [
        { modelName: { equals: 'NVIDIA RTX 4090', mode: 'insensitive' } },
        { brand: { name: { equals: 'NVIDIA RTX 4090', mode: 'insensitive' } } },
        { modelName: { contains: 'NVIDIA RTX 4090', mode: 'insensitive' } },
        { brand: { name: { contains: 'NVIDIA RTX 4090', mode: 'insensitive' } } },
        {
          AND: [
            { brand: { name: { contains: 'NVIDIA', mode: 'insensitive' } } },
            { modelName: { contains: 'RTX 4090', mode: 'insensitive' } },
          ],
        },
      ],
    })
  })

  it('builds stable GPU ordering with explicit defaults', () => {
    expect(buildGpuOrderBy()).toEqual([{ brand: { name: 'asc' } }, { modelName: 'asc' }])
    expect(buildGpuOrderBy('pcListings', 'desc')).toEqual([{ pcListings: { _count: 'desc' } }])
  })

  it('builds paginated list query primitives', () => {
    expect(buildGpuListQuery({ page: 3, limit: 25, sortField: 'modelName' })).toEqual({
      where: {},
      orderBy: [{ modelName: 'asc' }],
      pagination: {
        limit: 25,
        offset: 50,
        page: 3,
      },
    })
  })

  it('builds GPU dropdown query primitives with lookahead pagination', () => {
    expect(buildGpuOptionsQuery({ search: 'Radeon', offset: 10, limit: 5 })).toEqual({
      where: {
        OR: [
          { modelName: { equals: 'Radeon', mode: 'insensitive' } },
          { brand: { name: { equals: 'Radeon', mode: 'insensitive' } } },
          { modelName: { contains: 'Radeon', mode: 'insensitive' } },
          { brand: { name: { contains: 'Radeon', mode: 'insensitive' } } },
        ],
      },
      orderBy: [{ brand: { name: 'asc' } }, { modelName: 'asc' }],
      limit: 5,
      offset: 10,
    })
  })

  it('builds mobile GPU list query primitives with the old search behavior', () => {
    expect(buildMobileGpuListQuery({ search: 'NVIDIA RTX 4090', page: 2, limit: 1000 })).toEqual({
      where: {
        OR: [
          { modelName: { equals: 'NVIDIA RTX 4090', mode: 'insensitive' } },
          { brand: { name: { equals: 'NVIDIA RTX 4090', mode: 'insensitive' } } },
          { modelName: { contains: 'NVIDIA RTX 4090', mode: 'insensitive' } },
          { brand: { name: { contains: 'NVIDIA RTX 4090', mode: 'insensitive' } } },
          {
            AND: [
              { brand: { name: { contains: 'NVIDIA', mode: 'insensitive' } } },
              { modelName: { contains: 'RTX 4090', mode: 'insensitive' } },
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

  it('builds mobile PC listing GPU query primitives with the old simple search behavior', () => {
    expect(
      buildMobilePcListingGpuQuery({ search: 'Radeon', brandId: BRAND_ID, limit: 100 }),
    ).toEqual({
      where: {
        brandId: BRAND_ID,
        OR: [
          { modelName: { contains: 'Radeon', mode: 'insensitive' } },
          { brand: { name: { contains: 'Radeon', mode: 'insensitive' } } },
        ],
      },
      orderBy: { modelName: 'asc' },
      limit: 100,
    })
  })

  it('builds case-insensitive model conflict predicates scoped to the selected brand', () => {
    expect(
      buildGpuModelNameConflictWhere({
        brandId: BRAND_ID,
        modelName: 'GeForce RTX 4090',
        excludeId: GPU_ID,
      }),
    ).toEqual({
      brandId: BRAND_ID,
      modelName: { equals: 'GeForce RTX 4090', mode: 'insensitive' },
      id: { not: GPU_ID },
    })
  })
})
