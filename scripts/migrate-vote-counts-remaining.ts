#!/usr/bin/env tsx
/**
 * Migration script to populate remaining vote count columns
 * Only processes listings that haven't been migrated yet
 */

import path from 'path'
import dotenv from 'dotenv'
import { PrismaClient } from '../prisma/generated/client'
import { calculateWilsonScore } from '../src/server/utils/wilson-score'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

async function migrateRemainingVoteCounts() {
  console.log('Processing remaining vote counts...')

  try {
    // Get listings that have votes but haven't been migrated
    const unmigrated = await prisma.listing.findMany({
      where: {
        votes: { some: {} },
        voteCount: 0,
      },
      select: { id: true },
    })

    console.log(`Found ${unmigrated.length} listings that need migration`)

    // Process one by one to avoid connection issues
    for (let i = 0; i < unmigrated.length; i++) {
      const listing = unmigrated[i]

      try {
        const votes = await prisma.vote.findMany({
          where: { listingId: listing.id },
          select: { value: true },
        })

        const upvotes = votes.filter((v) => v.value).length
        const downvotes = votes.filter((v) => !v.value).length
        const voteCount = votes.length
        const successRate = calculateWilsonScore(upvotes, downvotes)

        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            upvoteCount: upvotes,
            downvoteCount: downvotes,
            voteCount,
            successRate,
          },
        })

        if ((i + 1) % 10 === 0 || i === unmigrated.length - 1) {
          console.log(`Processed ${i + 1}/${unmigrated.length} listings...`)
        }

        // Tiny delay to prevent connection pool issues
        await new Promise((resolve) => setTimeout(resolve, 50))
      } catch (error) {
        console.error(`Failed to process listing ${listing.id}:`, error)
      }
    }

    // Process PC listings
    console.log('\nProcessing PC listings...')
    const pcListings = await prisma.pcListing.findMany({
      select: { id: true },
    })

    for (let i = 0; i < pcListings.length; i++) {
      const pcListing = pcListings[i]

      try {
        const votes = await prisma.pcListingVote.findMany({
          where: { pcListingId: pcListing.id },
          select: { value: true },
        })

        const upvotes = votes.filter((v) => v.value).length
        const downvotes = votes.filter((v) => !v.value).length
        const voteCount = votes.length
        const successRate = calculateWilsonScore(upvotes, downvotes)

        await prisma.pcListing.update({
          where: { id: pcListing.id },
          data: {
            upvoteCount: upvotes,
            downvoteCount: downvotes,
            voteCount,
            successRate,
          },
        })

        if ((i + 1) % 10 === 0 || i === pcListings.length - 1) {
          console.log(`Processed ${i + 1}/${pcListings.length} PC listings...`)
        }

        await new Promise((resolve) => setTimeout(resolve, 50))
      } catch (error) {
        console.error(`Failed to process PC listing ${pcListing.id}:`, error)
      }
    }

    console.log('✅ Migration completed!')

    // Final verification
    const [listingsWithVotes, listingsPopulated] = await Promise.all([
      prisma.listing.count({ where: { votes: { some: {} } } }),
      prisma.listing.count({ where: { votes: { some: {} }, voteCount: { gt: 0 } } }),
    ])

    console.log(
      `\nFinal status: ${listingsPopulated}/${listingsWithVotes} listings with votes have counts`,
    )
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

migrateRemainingVoteCounts()
