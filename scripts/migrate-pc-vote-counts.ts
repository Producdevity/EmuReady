#!/usr/bin/env npx tsx
/**
 * Migration script to populate vote count columns for PC listings
 */

import path from 'path'
import dotenv from 'dotenv'
import { PrismaClient } from '@orm'
import { calculateWilsonScore } from '../src/server/utils/wilson-score'

// Load .env.local for local development
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

async function migratePcVoteCounts() {
  console.log('Starting PC listing vote count migration...')

  // Get all PC listings
  const pcListings = await prisma.pcListing.findMany({
    select: { id: true },
  })

  console.log(`Found ${pcListings.length} PC listings to process`)

  // Process in batches to avoid overwhelming the database
  const batchSize = 100
  let processed = 0

  for (let i = 0; i < pcListings.length; i += batchSize) {
    const batch = pcListings.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (pcListing) => {
        // Get vote counts for this PC listing
        const votes = await prisma.pcListingVote.findMany({
          where: { pcListingId: pcListing.id },
          select: { value: true },
        })

        const upvoteCount = votes.filter((v) => v.value).length
        const downvoteCount = votes.filter((v) => !v.value).length
        const voteCount = votes.length
        const successRate = calculateWilsonScore(upvoteCount, downvoteCount)

        // Update the PC listing with materialized counts
        await prisma.pcListing.update({
          where: { id: pcListing.id },
          data: {
            upvoteCount,
            downvoteCount,
            voteCount,
            successRate,
          },
        })
      }),
    )

    processed += batch.length
    if (processed % 100 === 0) {
      console.log(`Processed ${processed}/${pcListings.length} PC listings...`)
    }
  }

  console.log(`Processed ${pcListings.length}/${pcListings.length} PC listings...`)
  console.log('✅ PC listing vote count migration completed successfully!')

  // Verify a sample
  const sample = await prisma.pcListing.findMany({
    take: 5,
    orderBy: { voteCount: 'desc' },
    select: {
      id: true,
      upvoteCount: true,
      downvoteCount: true,
      successRate: true,
      voteCount: true,
      _count: {
        select: { votes: true },
      },
    },
  })

  console.log('\nSample verification:')
  sample.forEach((pc) => {
    console.log(
      `PC Listing ${pc.id.substring(0, 8)}: ${pc.upvoteCount} up, ${pc.downvoteCount} down, ` +
        `${pc.successRate.toFixed(2)} rate (${pc.voteCount} total votes)`,
    )
  })
}

migratePcVoteCounts()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
