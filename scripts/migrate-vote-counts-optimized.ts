#!/usr/bin/env tsx
/**
 * Optimized migration script to populate vote count columns
 * Processes in smaller batches to avoid connection pool exhaustion
 */

import path from 'path'
import dotenv from 'dotenv'
import { PrismaClient } from '../prisma/generated/client'
import { calculateWilsonScore } from '../src/server/utils/wilson-score'

// Load .env.local for local development
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient({
  // Increase connection pool settings
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function processListingBatch(listings: { id: string }[]) {
  for (const listing of listings) {
    try {
      // Get vote counts for this listing
      const votes = await prisma.vote.findMany({
        where: { listingId: listing.id },
        select: { value: true },
      })

      const upvotes = votes.filter((v) => v.value).length
      const downvotes = votes.filter((v) => !v.value).length
      const voteCount = votes.length
      const successRate = calculateWilsonScore(upvotes, downvotes)

      // Update listing with calculated values
      await prisma.listing.update({
        where: { id: listing.id },
        data: {
          upvoteCount: upvotes,
          downvoteCount: downvotes,
          voteCount,
          successRate,
        },
      })
    } catch (error) {
      console.error(`Failed to process listing ${listing.id}:`, error)
    }
  }
}

async function processPcListingBatch(pcListings: { id: string }[]) {
  for (const pcListing of pcListings) {
    try {
      // Get vote counts for this PC listing
      const votes = await prisma.pcListingVote.findMany({
        where: { pcListingId: pcListing.id },
        select: { value: true },
      })

      const upvotes = votes.filter((v) => v.value).length
      const downvotes = votes.filter((v) => !v.value).length
      const voteCount = votes.length
      const successRate = calculateWilsonScore(upvotes, downvotes)

      // Update PC listing with calculated values
      await prisma.pcListing.update({
        where: { id: pcListing.id },
        data: {
          upvoteCount: upvotes,
          downvoteCount: downvotes,
          voteCount,
          successRate,
        },
      })
    } catch (error) {
      console.error(`Failed to process PC listing ${pcListing.id}:`, error)
    }
  }
}

async function migrateVoteCounts() {
  console.log('Starting optimized vote count migration...')

  try {
    // Get all regular listings
    const listings = await prisma.listing.findMany({
      select: { id: true },
    })

    // Get all PC listings
    const pcListings = await prisma.pcListing.findMany({
      select: { id: true },
    })

    console.log(`Found ${listings.length} listings and ${pcListings.length} PC listings to process`)

    // Process in smaller batches to avoid connection pool issues
    const batchSize = 20 // Smaller batch size
    let processed = 0

    // Process regular listings
    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize)
      await processListingBatch(batch)

      processed += batch.length
      if (processed % 100 === 0 || processed === listings.length) {
        console.log(`Processed ${processed}/${listings.length} listings...`)
      }

      // Small delay to prevent overwhelming the connection pool
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Process PC listings
    console.log('\nProcessing PC listings...')
    processed = 0

    for (let i = 0; i < pcListings.length; i += batchSize) {
      const batch = pcListings.slice(i, i + batchSize)
      await processPcListingBatch(batch)

      processed += batch.length
      if (processed % 20 === 0 || processed === pcListings.length) {
        console.log(`Processed ${processed}/${pcListings.length} PC listings...`)
      }

      // Small delay to prevent overwhelming the connection pool
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.log('✅ Vote count migration completed successfully!')

    // Verify a few random listings
    const samples = await prisma.listing.findMany({
      take: 3,
      where: { voteCount: { gt: 0 } },
      orderBy: { voteCount: 'desc' },
      select: {
        id: true,
        upvoteCount: true,
        downvoteCount: true,
        voteCount: true,
        successRate: true,
      },
    })

    console.log('\nSample verification:')
    samples.forEach((s) => {
      console.log(
        `Listing ${s.id.substring(0, 8)}: ${s.upvoteCount} up, ${s.downvoteCount} down, ${s.successRate.toFixed(2)} rate (${s.voteCount} total)`,
      )
    })
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

migrateVoteCounts()
