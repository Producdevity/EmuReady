import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@/server/db'
import { Role } from '@orm'
import type { NextRequest } from 'next/server'

type ClerkWebhookEvent = {
  type: string
  data: {
    id: string
    email_addresses: Array<{
      email_address: string
      id: string
    }>
    primary_email_address_id?: string
    first_name?: string
    last_name?: string
    full_name?: string
    image_url?: string
    username?: string
    public_metadata?: {
      role?: string
    }
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

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('❌ Missing required svix headers')
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await request.text()

  // Verify webhook
  const webhook = new Webhook(WEBHOOK_SECRET)
  let event: ClerkWebhookEvent

  try {
    event = webhook.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent
  } catch (error) {
    console.error('❌ Webhook verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 },
    )
  }

  // Handle the webhook event
  try {
    switch (event.type) {
      case 'user.created':
        await handleUserCreated(event.data)
        break
      case 'user.updated':
        await handleUserUpdated(event.data)
        break
      case 'user.deleted':
        await handleUserDeleted(event.data)
        break
      default:
        console.log(`⚠️ Unhandled webhook event: ${event.type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    )
  }
}

async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  // Use primary_email_address_id if available, otherwise fall back to first email
  const primaryEmail = data.primary_email_address_id
    ? data.email_addresses.find(
        (email) => email.id === data.primary_email_address_id,
      )
    : data.email_addresses[0]

  if (!primaryEmail) {
    console.error('❌ No primary email found for user:', data.id)
    return
  }

  // Determine role from public metadata, default to USER
  const role = (data.public_metadata?.role as Role) ?? Role.USER

  // Use full_name, or combine first_name + last_name, or use username as fallback
  let displayName = data.full_name
  if (!displayName && data.first_name) {
    displayName = data.last_name
      ? `${data.first_name} ${data.last_name}`
      : data.first_name
  }
  if (!displayName && data.username) {
    displayName = data.username
  }

  const userData = {
    clerkId: data.id,
    email: primaryEmail.email_address,
    name: displayName ?? null,
    profileImage: data.image_url ?? null,
    role: role,
  }

  try {
    await prisma.user.create({
      data: userData,
    })
  } catch (error) {
    console.error('❌ Failed to create user in database:', error)
    throw error // Re-throw to return 500 status
  }
}

async function handleUserUpdated(data: ClerkWebhookEvent['data']) {
  // Use primary_email_address_id if available, otherwise fall back to first email
  const primaryEmail = data.primary_email_address_id
    ? data.email_addresses.find(
        (email) => email.id === data.primary_email_address_id,
      )
    : data.email_addresses[0]

  if (!primaryEmail) {
    console.error('❌ No primary email found for user:', data.id)
    return
  }

  // Determine role from public metadata
  const role = data.public_metadata?.role as Role

  // Use full_name, or combine first_name + last_name, or use username as fallback
  let displayName = data.full_name
  if (!displayName && data.first_name) {
    displayName = data.last_name
      ? `${data.first_name} ${data.last_name}`
      : data.first_name
  }
  if (!displayName && data.username) {
    displayName = data.username
  }

  const updateData = {
    email: primaryEmail.email_address,
    name: displayName ?? null,
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
    throw error // Re-throw to return 500 status
  }
}

async function handleUserDeleted(data: ClerkWebhookEvent['data']) {
  try {
    await prisma.user.delete({
      where: { clerkId: data.id },
    })
  } catch (error) {
    console.error('❌ Failed to delete user from database:', error)
    throw error // Re-throw to return 500 status
  }
}
