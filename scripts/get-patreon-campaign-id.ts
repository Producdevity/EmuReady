#!/usr/bin/env tsx

import { resolve } from 'path'
import { config } from 'dotenv'
import http from '../src/rest/http'

config({ path: resolve(process.cwd(), '.env.local') })

async function getPatreonCampaignId() {
  const creatorToken = process.env.PATREON_CREATOR_TOKEN

  if (!creatorToken) {
    console.error('❌ PATREON_CREATOR_TOKEN not found in environment variables')
    console.error('Make sure it exists in your .env.local file')
    process.exit(1)
  }

  console.log('🔍 Fetching campaign information from Patreon API...\n')

  try {
    // Try without field filters - id should always be returned
    const url = 'https://www.patreon.com/api/oauth2/v2/campaigns'
    const response = await http.get(url, {
      headers: {
        Authorization: `Bearer ${creatorToken}`,
      },
      validateStatus: () => true,
    })

    if (response.status !== 200) {
      console.error('❌ API request failed')
      console.error('Status:', response.status)
      console.error('Response:', JSON.stringify(response.data, null, 2))
      process.exit(1)
    }

    const data = response.data as { data?: { id: string; type: string; attributes?: unknown }[] }

    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.error('❌ No campaigns found')
      console.error('Response:', JSON.stringify(data, null, 2))
      console.error('\nThis could mean:')
      console.error('  1. Your Patreon account has no campaigns')
      console.error('  2. The creator token is invalid or expired')
      console.error('  3. The token lacks campaign permissions')
      process.exit(1)
    }

    const campaign = data.data[0]
    const campaignId = campaign.id

    console.log('✅ Successfully retrieved campaign information!\n')
    console.log('📋 Campaign Details:')
    console.log('─'.repeat(50))
    console.log(`Campaign ID: ${campaignId}`)
    console.log(`Type: ${campaign.type}`)
    if (campaign.attributes) {
      console.log('Attributes:', JSON.stringify(campaign.attributes, null, 2))
    }
    console.log('─'.repeat(50))
    console.log('\n🔧 Add this to your .env.local and Vercel:')
    console.log(`PATREON_CAMPAIGN_ID=${campaignId}`)
    console.log('\n💡 Vercel command:')
    console.log(`vercel env add PATREON_CAMPAIGN_ID production`)
    console.log(`# Then paste: ${campaignId}`)
  } catch (error) {
    console.error('❌ Error fetching campaign:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
    }
    process.exit(1)
  }
}

getPatreonCampaignId()
