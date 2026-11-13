import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  BatchBySteamAppIdsResponseSchema,
  BatchBySteamAppIdsSchema,
  BatchSteamFullResultSchema,
} from '@/schemas/mobile'

describe('generated Steam batch response example', () => {
  it('documents the default full response with a game, system, and compatibility report', () => {
    const file = resolve(import.meta.dirname, '../../../public/api-docs/mobile-openapi.json')
    let example: unknown = JSON.parse(readFileSync(file, 'utf8'))
    for (const key of [
      'paths',
      '/games.batchBySteamAppIds',
      'get',
      'responses',
      '200',
      'content',
      'application/json',
      'examples',
      'success',
      'value',
      'result',
      'data',
    ]) {
      example = z.record(z.unknown()).parse(example)[key]
    }

    const serializedGame = BatchSteamFullResultSchema.shape.game.unwrap().extend({
      createdAt: z.coerce.date(),
    })
    const response = BatchBySteamAppIdsResponseSchema.extend({
      results: z.array(BatchSteamFullResultSchema.extend({ game: serializedGame })),
    }).parse(example)

    expect(BatchBySteamAppIdsSchema.parse({ steamAppIds: ['220'] }).minimal).toBe(false)
    expect(response.results).toHaveLength(1)
    expect(response.results[0].steamAppId).toBe('220')
    expect(response.results[0].game.system.key).toBe('microsoft_windows')
    expect(response.results[0].game.listings).toHaveLength(1)
    expect(response.totalFound).toBe(response.results.length)
  })
})

describe('generated report integer input contracts', () => {
  const file = resolve(import.meta.dirname, '../../../public/api-docs/mobile-openapi.json')
  const schemas = z
    .object({ components: z.object({ schemas: z.record(z.unknown()) }) })
    .parse(JSON.parse(readFileSync(file, 'utf8'))).components.schemas

  it.each([
    'CreateListingSchema',
    'UpdateListingSchema',
    'CreatePcListingSchema',
    'UpdatePcListingSchema',
  ])('documents persisted performance ID bounds for %s', (name) => {
    expect(schemas[name]).toMatchObject({
      properties: {
        performanceId: { type: 'integer', minimum: -2_147_483_648, maximum: 2_147_483_647 },
      },
    })
  })

  it('documents bounded integer memory while keeping PC update fields optional', () => {
    expect(schemas.UpdatePcListingSchema).toMatchObject({
      properties: { memorySize: { type: 'integer', minimum: 1, maximum: 256 } },
      required: ['id'],
    })
  })
})
