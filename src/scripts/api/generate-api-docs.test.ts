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

describe('generated mobile numeric input contracts', () => {
  const file = resolve(import.meta.dirname, '../../../public/api-docs/mobile-openapi.json')
  const schemas = z
    .object({ components: z.object({ schemas: z.record(z.unknown()) }) })
    .parse(JSON.parse(readFileSync(file, 'utf8'))).components.schemas
  const limit = { type: 'integer', minimum: 1, maximum: 50, default: 20 }

  it.each([
    { name: 'GetGamesSchema', optional: true },
    { name: 'GetListingsSchema', optional: true },
    { name: 'GetPcListingsSchema', optional: false },
  ])('documents nullable integer pages and bounded integer limits for $name', (schema) => {
    const properties = {
      page: {
        anyOf: [
          { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER, default: 1 },
          { type: 'null' },
        ],
      },
      limit,
    }
    expect(schemas[schema.name]).toMatchObject(
      schema.optional ? { anyOf: [{}, { properties }] } : { properties },
    )
  })

  it('documents bounded integer preset list limits', () => {
    expect(schemas.GetPcPresetsSchema).toMatchObject({ properties: { limit } })
  })

  it.each(['CreatePcPresetSchema', 'UpdatePcPresetSchema'])(
    'documents integer memory sizes for %s',
    (name) => {
      expect(schemas[name]).toMatchObject({
        properties: { memorySize: { type: 'integer', minimum: 1, maximum: 256 } },
      })
    },
  )
})
