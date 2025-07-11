import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextResponse } from 'next/server'
import analytics from '@/lib/analytics'
import { prisma } from '@/server/db'
import { Role } from '@orm'
import type { NextRequest } from 'next/server'

interface ClerkWebhookEvent {
  data: {
    id: string
    username?: string
    email_addresses: Array<{
      id: string
      email_address: string
    }>
    primary_email_address_id?: string
    public_metadata?: {
      role?: Role
    }
    image_url?: string
  }
  type: string
}

async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  const primaryEmail = data.primary_email_address_id
    ? data.email_addresses.find(
        (email) => email.id === data.primary_email_address_id,
      )
    : data.email_addresses[0]

  if (!primaryEmail) {
    console.error('❌ No primary email found for user:', data.id)
    return
  }

  const role = (data.public_metadata?.role as Role) ?? Role.USER

  let displayName: string | null = null
  if (data.username) {
    displayName = data.username
  }

  try {
    const user = await prisma.user.create({
      data: {
        clerkId: data.id,
        email: primaryEmail.email_address,
        name: displayName,
        profileImage: data.image_url ?? null,
        role: role,
      },
    })

    analytics.user.signedUp({
      userId: user.id,
    })

    analytics.userJourney.registrationCompleted({
      userId: user.id,
    })

    analytics.userJourney.registrationStarted({
      userId: user.id,
    })

    analytics.conversion.funnelStepCompleted({
      userId: user.id,
      funnelName: 'user_registration',
      stepName: 'registration_completed',
      stepIndex: 1,
    })
  } catch (error) {
    console.error('❌ Failed to create user in database:', error)
    throw error
  }
}

async function handleUserUpdated(data: ClerkWebhookEvent['data']) {
  const primaryEmail = data.primary_email_address_id
    ? data.email_addresses.find(
        (email) => email.id === data.primary_email_address_id,
      )
    : data.email_addresses[0]

  if (!primaryEmail) {
    console.error('❌ No primary email found for user:', data.id)
    return
  }

  const role = data.public_metadata?.role as Role

  let displayName: string | null = null
  if (data.username) {
    displayName = data.username
  }

  if (displayName) {
    const existingUserWithName = await prisma.user.findFirst({
      where: {
        name: displayName,
        clerkId: { not: data.id },
      },
    })

    if (existingUserWithName) {
      console.warn(
        `⚠️ Username conflict: "${displayName}" already exists for another user. Skipping username update for user ${data.id}`,
      )
      displayName = null
    }
  }

  const updateData = {
    email: primaryEmail.email_address,
    ...(displayName !== null && { name: displayName }),
    profileImage: data.image_url ?? null,
    ...(role && { role: role }),
  }

  try {
    await prisma.user.update({
      where: { clerkId: data.id },
      data: updateData,
    })
  } catch (error) {
    console.error('❌ Failed to update user in database:', error)
    throw error
  }
}

async function handleUserDeleted(data: ClerkWebhookEvent['data']) {
  try {
    await prisma.user.delete({
      where: { clerkId: data.id },
    })
  } catch (error) {
    console.error('❌ Failed to delete user from database:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('❌ Missing CLERK_WEBHOOK_SECRET environment variable')
    return NextResponse.json(
      { error: 'Missing webhook secret' },
      { status: 500 },
    )
  }

  let evt: ClerkWebhookEvent
  try {
    evt = (await verifyWebhook(request, {
      signingSecret: WEBHOOK_SECRET,
    })) as ClerkWebhookEvent
  } catch (err) {
    console.error('❌ Error verifying webhook:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const { data, type } = evt

  try {
    switch (type) {
      case 'user.created':
        await handleUserCreated(data)
        break
      case 'user.updated':
        await handleUserUpdated(data)
        break
      case 'user.deleted':
        await handleUserDeleted(data)
        break
      default:
        console.log(`Unhandled webhook type: ${type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`❌ Error handling webhook ${type}:`, error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
