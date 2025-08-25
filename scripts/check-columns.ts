#!/usr/bin/env tsx

import { PrismaClient } from '../prisma/generated/client'

const prisma = new PrismaClient()

async function checkColumns() {
  try {
    // Check if vote count columns exist on Listing table
    const listingColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Listing' 
      AND column_name IN ('upvoteCount', 'downvoteCount', 'voteCount', 'successRate')
    `

    // Check if vote count columns exist on PcListing table (try both case variations)
    let pcListingColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'PcListing' 
      AND column_name IN ('upvoteCount', 'downvoteCount', 'voteCount', 'successRate')
    `

    if (pcListingColumns.length === 0) {
      pcListingColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'pc_listings' 
        AND column_name IN ('upvoteCount', 'downvoteCount', 'voteCount', 'successRate')
      `
    }

    // Check if metadata column exists on Game table
    const gameColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Game' 
      AND column_name = 'metadata'
    `

    console.log('=== COLUMN CHECK RESULTS ===\n')

    console.log(
      'Listing vote columns found:',
      listingColumns.length > 0 ? listingColumns.map((c) => c.column_name).join(', ') : 'NONE',
    )
    console.log(
      'PcListing vote columns found:',
      pcListingColumns.length > 0 ? pcListingColumns.map((c) => c.column_name).join(', ') : 'NONE',
    )
    console.log('Game metadata column found:', gameColumns.length > 0 ? 'YES' : 'NO')

    console.log('\n=== MIGRATION STATUS ===')
    if (listingColumns.length === 0) {
      console.log(
        '✅ Vote count columns NOT present - migration 20250118_add_vote_counts needs to be applied',
      )
    } else {
      console.log('⚠️  Vote count columns already present')
    }

    if (gameColumns.length === 0) {
      console.log(
        '✅ Game metadata column NOT present - migration 20250823_add_game_metadata needs to be applied',
      )
    } else {
      console.log('⚠️  Game metadata column already present')
    }
  } catch (error) {
    console.error('Error checking columns:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkColumns()
