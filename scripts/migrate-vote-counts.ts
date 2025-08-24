#!/usr/bin/env tsx
/**
 * Migration script to populate vote count columns for existing listings
 * Run with: npx tsx scripts/migrate-vote-counts.ts
 */

import path from 'path'
import dotenv from 'dotenv'
import { PrismaClient } from '../prisma/generated/client'
import { calculateWilsonScore } from '../src/server/utils/wilson-score'

// Load .env.local for local development
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

async function migrateVoteCounts() {
  console.log('Starting vote count migration...')

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

    let processed = 0
    const batchSize = 100

    // Process in batches for better performance
    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (listing: { id: string }) => {
          // Get vote counts
          const [upvotes, downvotes] = await Promise.all([
            prisma.vote.count({
              where: { listingId: listing.id, value: true },
            }),
            prisma.vote.count({
              where: { listingId: listing.id, value: false },
            }),
          ])

          const voteCount = upvotes + downvotes
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
        }),
      )

      processed += batch.length
      console.log(`Processed ${processed}/${listings.length} listings...`)
    }

    // Process PC listings
    console.log('\nProcessing PC listings...')
    processed = 0

    for (let i = 0; i < pcListings.length; i += batchSize) {
      const batch = pcListings.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (pcListing: { id: string }) => {
          // Get vote counts
          const [upvotes, downvotes] = await Promise.all([
            prisma.pcListingVote.count({
              where: { pcListingId: pcListing.id, value: true },
            }),
            prisma.pcListingVote.count({
              where: { pcListingId: pcListing.id, value: false },
            }),
          ])

          const voteCount = upvotes + downvotes
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
        }),
      )

      processed += batch.length
      console.log(`Processed ${processed}/${pcListings.length} PC listings...`)
    }

    console.log('✅ Vote count migration completed successfully!')

    // Verify a few random listings
    const samples = await prisma.listing.findMany({
      take: 3,
      select: {
        id: true,
        upvoteCount: true,
        downvoteCount: true,
        voteCount: true,
        successRate: true,
        _count: {
          select: { votes: true },
        },
      },
    })

    const pcSamples = await prisma.pcListing.findMany({
      take: 3,
      select: {
        id: true,
        upvoteCount: true,
        downvoteCount: true,
        voteCount: true,
        successRate: true,
        _count: {
          select: { votes: true },
        },
      },
    })

    console.log('\nSample verification (Listings):')
    samples.forEach((s: (typeof samples)[0]) => {
      console.log(
        `Listing ${s.id}: ${s.upvoteCount} up, ${s.downvoteCount} down, ${s.successRate.toFixed(2)} rate (${s._count.votes} total votes)`,
      )
    })

    console.log('\nSample verification (PC Listings):')
    pcSamples.forEach((s: (typeof pcSamples)[0]) => {
      console.log(
        `PC Listing ${s.id}: ${s.upvoteCount} up, ${s.downvoteCount} down, ${s.successRate.toFixed(2)} rate (${s._count.votes} total votes)`,
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
