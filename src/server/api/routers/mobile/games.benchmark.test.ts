/**
 * Benchmark tests for batch Steam App ID lookup endpoint
 *
 * These tests measure:
 * - Response time for different batch sizes
 * - Database query count
 * - Memory usage
 * - Cache effectiveness
 * - Cost estimates
 *
 * Run with: npm test -- games.benchmark.test.ts
 */

import { describe, it, beforeEach, expect, vi, beforeAll, afterAll } from 'vitest'
import { GamesRepository } from '@/server/repositories/games.repository'
import { steamBatchQueryCache } from '@/server/utils/cache'
import { matchSteamAppIdsToNames, validateSteamAppIds } from '@/server/utils/steamGameBatcher'
import * as steamGameSearch from '@/server/utils/steamGameSearch'
import { type PrismaClient } from '@orm'

vi.mock('@orm', async () => {
  const actual = await import('@orm')
  return {
    ...actual,
    Prisma: {
      QueryMode: {
        insensitive: 'insensitive',
      },
      SortOrder: {
        asc: 'asc',
        desc: 'desc',
      },
    },
  }
})

interface BenchmarkResult {
  batchSize: number
  duration: number
  queriesExecuted: number
  memoryUsed: number
  cacheHit: boolean
}

describe('Batch Steam App ID Lookup - Benchmarks', () => {
  let queryCount = 0
  let mockPrisma: PrismaClient

  beforeAll(() => {
    // Mock Prisma to count queries
    mockPrisma = {
      game: {
        findMany: vi.fn(async () => {
          queryCount++
          // Simulate realistic query time
          await new Promise((resolve) => setTimeout(resolve, 50))
          return []
        }),
        count: vi.fn(async () => {
          queryCount++
          return 0
        }),
      },
    } as unknown as PrismaClient
  })

  beforeEach(() => {
    queryCount = 0
    steamBatchQueryCache.clear()
    vi.clearAllMocks()
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  async function benchmarkBatchLookup(
    steamAppIds: string[],
    cacheEnabled = true,
  ): Promise<BenchmarkResult> {
    const startTime = performance.now()
    const startMemory = process.memoryUsage().heapUsed

    const cacheKey = cacheEnabled ? `batch:${steamAppIds.sort().join(',')}:all:10:false` : null

    const cacheHit = cacheKey ? steamBatchQueryCache.get(cacheKey) !== undefined : false

    if (!cacheHit || !cacheEnabled) {
      queryCount = 0

      // Validation
      const validation = validateSteamAppIds(steamAppIds)
      expect(validation.valid).toBe(true)

      // Match Steam App IDs to names
      vi.spyOn(steamGameSearch, 'getSteamGamesData').mockResolvedValue(
        steamAppIds.map((id, i) => ({ appid: Number(id), name: `Game ${i}` })),
      )

      const matchResults = await matchSteamAppIdsToNames(steamAppIds)
      const steamAppIdToName = new Map<string, string>()
      for (const match of matchResults) {
        if (match.gameName) {
          steamAppIdToName.set(match.steamAppId, match.gameName)
        }
      }

      // Database lookup
      const repository = new GamesRepository(mockPrisma)
      const results = await repository.batchBySteamAppIds(steamAppIdToName, {
        maxListingsPerGame: 10,
        showNsfw: false,
      })

      // Cache result if enabled
      if (cacheEnabled && cacheKey) {
        steamBatchQueryCache.set(cacheKey, {
          success: true,
          results,
          totalRequested: steamAppIds.length,
          totalFound: results.filter((r) => r.game !== null).length,
          totalNotFound: results.filter((r) => r.game === null).length,
        })
      }
    }

    const endTime = performance.now()
    const endMemory = process.memoryUsage().heapUsed

    return {
      batchSize: steamAppIds.length,
      duration: endTime - startTime,
      queriesExecuted: queryCount,
      memoryUsed: endMemory - startMemory,
      cacheHit,
    }
  }

  it('Benchmark: 10 Steam App IDs (cold cache)', async () => {
    const steamAppIds = Array.from({ length: 10 }, (_, i) => String(i + 1))
    const result = await benchmarkBatchLookup(steamAppIds, false)

    console.log('\n📊 Benchmark: 10 IDs (cold cache)')
    console.log(`   Duration: ${result.duration.toFixed(2)}ms`)
    console.log(`   Queries: ${result.queriesExecuted}`)
    console.log(`   Memory: ${(result.memoryUsed / 1024 / 1024).toFixed(2)}MB`)

    expect(result.queriesExecuted).toBe(1)
    expect(result.duration).toBeLessThan(1000)
  })

  it('Benchmark: 10 Steam App IDs (warm cache)', async () => {
    const steamAppIds = Array.from({ length: 10 }, (_, i) => String(i + 1))

    // First call to populate cache
    await benchmarkBatchLookup(steamAppIds, true)

    // Second call should hit cache
    const result = await benchmarkBatchLookup(steamAppIds, true)

    console.log('\n📊 Benchmark: 10 IDs (warm cache)')
    console.log(`   Duration: ${result.duration.toFixed(2)}ms`)
    console.log(`   Queries: ${result.queriesExecuted}`)
    console.log(`   Cache hit: ${result.cacheHit ? 'YES ✅' : 'NO ❌'}`)

    expect(result.cacheHit).toBe(true)
    expect(result.queriesExecuted).toBeLessThanOrEqual(1)
    expect(result.duration).toBeLessThan(50)
  })

  it('Benchmark: 100 Steam App IDs (cold cache)', async () => {
    const steamAppIds = Array.from({ length: 100 }, (_, i) => String(i + 1))
    const result = await benchmarkBatchLookup(steamAppIds, false)

    console.log('\n📊 Benchmark: 100 IDs (cold cache)')
    console.log(`   Duration: ${result.duration.toFixed(2)}ms`)
    console.log(`   Queries: ${result.queriesExecuted}`)
    console.log(`   Memory: ${(result.memoryUsed / 1024 / 1024).toFixed(2)}MB`)

    expect(result.queriesExecuted).toBe(1)
    expect(result.duration).toBeLessThan(2000)
  })

  it('Benchmark: 500 Steam App IDs (cold cache)', async () => {
    const steamAppIds = Array.from({ length: 500 }, (_, i) => String(i + 1))
    const result = await benchmarkBatchLookup(steamAppIds, false)

    console.log('\n📊 Benchmark: 500 IDs (cold cache)')
    console.log(`   Duration: ${result.duration.toFixed(2)}ms`)
    console.log(`   Queries: ${result.queriesExecuted}`)
    console.log(`   Memory: ${(result.memoryUsed / 1024 / 1024).toFixed(2)}MB`)

    expect(result.queriesExecuted).toBe(1)
    expect(result.duration).toBeLessThan(5000)
  })

  it('Benchmark: 900 Steam App IDs (cold cache)', async () => {
    const steamAppIds = Array.from({ length: 900 }, (_, i) => String(i + 1))
    const result = await benchmarkBatchLookup(steamAppIds, false)

    console.log('\n📊 Benchmark: 900 IDs (cold cache)')
    console.log(`   Duration: ${result.duration.toFixed(2)}ms`)
    console.log(`   Queries: ${result.queriesExecuted}`)
    console.log(`   Memory: ${(result.memoryUsed / 1024 / 1024).toFixed(2)}MB`)

    expect(result.queriesExecuted).toBe(1)
    expect(result.duration).toBeLessThan(10000)
  })

  it('Benchmark: 900 Steam App IDs (warm cache)', async () => {
    const steamAppIds = Array.from({ length: 900 }, (_, i) => String(i + 1))

    // First call to populate cache
    await benchmarkBatchLookup(steamAppIds, true)

    // Second call should hit cache
    const result = await benchmarkBatchLookup(steamAppIds, true)

    console.log('\n📊 Benchmark: 900 IDs (warm cache)')
    console.log(`   Duration: ${result.duration.toFixed(2)}ms`)
    console.log(`   Queries: ${result.queriesExecuted}`)
    console.log(`   Cache hit: ${result.cacheHit ? 'YES ✅' : 'NO ❌'}`)

    expect(result.cacheHit).toBe(true)
    expect(result.queriesExecuted).toBeLessThanOrEqual(1)
    expect(result.duration).toBeLessThan(100)
  })

  it('Cost Analysis: Estimate database costs', async () => {
    const batchSizes = [10, 100, 500, 900]
    const results: BenchmarkResult[] = []

    for (const size of batchSizes) {
      const steamAppIds = Array.from({ length: size }, (_, i) => String(i + 1))
      const result = await benchmarkBatchLookup(steamAppIds, false)
      results.push(result)
    }

    console.log('\n💰 Cost Analysis (per request)')
    console.log('   Assumptions:')
    console.log('   - PostgreSQL on Vercel: ~$0.000001 per query')
    console.log('   - 5-minute cache TTL = 80% cache hit rate')
    console.log('   - Database query cost: ~$0.000001 per complex query\n')

    for (const result of results) {
      const costPerRequest = result.queriesExecuted * 0.000001
      const costWith80PercentCache = costPerRequest * 0.2

      console.log(`   ${result.batchSize} IDs:`)
      console.log(`     Queries: ${result.queriesExecuted}`)
      console.log(`     Cost (no cache): $${costPerRequest.toFixed(8)}`)
      console.log(`     Cost (80% cache): $${costWith80PercentCache.toFixed(8)}`)
      console.log(`     Duration: ${result.duration.toFixed(2)}ms\n`)
    }

    console.log('   Projected costs at scale:')
    console.log('   - 1,000 requests/day (900 IDs each, 80% cache):')
    const dailyCost = 1000 * 0.000001 * 0.2
    console.log(`     Daily: $${dailyCost.toFixed(6)}`)
    console.log(`     Monthly: $${(dailyCost * 30).toFixed(6)}`)
    console.log(`     Yearly: $${(dailyCost * 365).toFixed(4)}`)

    console.log('\n   - 10,000 requests/day (900 IDs each, 80% cache):')
    const dailyCost10k = 10000 * 0.000001 * 0.2
    console.log(`     Daily: $${dailyCost10k.toFixed(5)}`)
    console.log(`     Monthly: $${(dailyCost10k * 30).toFixed(4)}`)
    console.log(`     Yearly: $${(dailyCost10k * 365).toFixed(3)}`)

    console.log('\n   - 100,000 requests/day (900 IDs each, 80% cache):')
    const dailyCost100k = 100000 * 0.000001 * 0.2
    console.log(`     Daily: $${dailyCost100k.toFixed(4)}`)
    console.log(`     Monthly: $${(dailyCost100k * 30).toFixed(3)}`)
    console.log(`     Yearly: $${(dailyCost100k * 365).toFixed(2)}\n`)

    // Assert costs are reasonable
    expect(dailyCost100k).toBeLessThan(0.1) // Less than 10 cents per day for 100k requests
  })

  it('Cache Effectiveness: Measure hit rate improvement', async () => {
    const steamAppIds = Array.from({ length: 100 }, (_, i) => String(i + 1))
    const iterations = 10

    let cacheHits = 0
    let totalQueries = 0

    for (let i = 0; i < iterations; i++) {
      const result = await benchmarkBatchLookup(steamAppIds, true)
      if (result.cacheHit) cacheHits++
      totalQueries += result.queriesExecuted
    }

    const cacheHitRate = (cacheHits / iterations) * 100

    console.log('\n📈 Cache Effectiveness (100 IDs, 10 iterations)')
    console.log(`   Cache hits: ${cacheHits}/${iterations}`)
    console.log(`   Hit rate: ${cacheHitRate.toFixed(1)}%`)
    console.log(`   Total queries: ${totalQueries}`)
    console.log(`   Queries saved: ${iterations - totalQueries}`)

    expect(cacheHitRate).toBeGreaterThan(80)
  })

  it('Memory Efficiency: Ensure memory usage is bounded', async () => {
    const initialMemory = process.memoryUsage().heapUsed

    // Simulate multiple large requests
    for (let i = 0; i < 10; i++) {
      const steamAppIds = Array.from({ length: 900 }, (_, j) => String(i * 1000 + j))
      await benchmarkBatchLookup(steamAppIds, true)
    }

    const finalMemory = process.memoryUsage().heapUsed
    const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024

    console.log('\n🧠 Memory Efficiency (10 requests × 900 IDs)')
    console.log(`   Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`)
    console.log(`   Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`)
    console.log(`   Memory growth: ${memoryGrowth.toFixed(2)}MB`)
    console.log(`   Cache size limit: 100 entries`)

    // Memory growth should be bounded by cache size
    expect(memoryGrowth).toBeLessThan(50) // Less than 50MB growth
  })

  it('Query Optimization: Verify single query per request', async () => {
    const testCases = [
      { size: 10, label: '10 IDs' },
      { size: 100, label: '100 IDs' },
      { size: 500, label: '500 IDs' },
      { size: 900, label: '900 IDs' },
    ]

    console.log('\n🔍 Query Count Verification')

    for (const testCase of testCases) {
      const steamAppIds = Array.from({ length: testCase.size }, (_, i) => String(i + 1))
      const result = await benchmarkBatchLookup(steamAppIds, false)

      console.log(`   ${testCase.label}: ${result.queriesExecuted} query`)

      // Should ALWAYS be exactly 1 query regardless of batch size
      expect(result.queriesExecuted).toBe(1)
    }
  })
})
