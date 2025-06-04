import { headers } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@/server/db'
import { Role } from '@orm'

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
  console.log('🔗 Webhook received at:', new Date().toISOString())
  console.log('🌍 Environment:', process.env.NODE_ENV)
  console.log('📍 Request URL:', request.url)

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('❌ Missing CLERK_WEBHOOK_SECRET environment variable')
    return NextResponse.json(
      { error: 'Missing webhook secret' },
      { status: 500 },
    )
  }

  // Get headers
  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  console.log('📥 Webhook headers:', {
    svixId: svixId ? 'present' : 'missing',
    svixTimestamp: svixTimestamp ? 'present' : 'missing',
    svixSignature: svixSignature ? 'present' : 'missing',
    contentType: headerPayload.get('content-type'),
    userAgent: headerPayload.get('user-agent'),
  })

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('❌ Missing required svix headers')
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  // Get body
  const payload = await request.text()
  console.log('📦 Webhook payload length:', payload.length)
  console.log('📦 Webhook payload preview:', `${payload.substring(0, 200)}...`)

  // Verify webhook
  const webhook = new Webhook(WEBHOOK_SECRET)
  let event: ClerkWebhookEvent

  try {
    event = webhook.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent
    console.log('✅ Webhook signature verified successfully')
    console.log('📝 Event type:', event.type)
    console.log('👤 User ID:', event.data.id)
  } catch (error) {
    console.error('❌ Webhook verification failed:', error)
    console.error('🔍 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 },
    )
  }

  // Handle the webhook event
  try {
    switch (event.type) {
      case 'user.created':
        console.log('👤 Processing user.created event for user:', event.data.id)
        await handleUserCreated(event.data)
        break
      case 'user.updated':
        console.log('🔄 Processing user.updated event for user:', event.data.id)
        await handleUserUpdated(event.data)
        break
      case 'user.deleted':
        console.log('🗑️ Processing user.deleted event for user:', event.data.id)
        await handleUserDeleted(event.data)
        break
      default:
        console.log(`⚠️ Unhandled webhook event: ${event.type}`)
    }

    console.log('✅ Webhook processed successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Webhook handler error:', error)
    console.error('🔍 Handler error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    })
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    )
  }
}

async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  console.log('🔍 Processing user creation for:', data.id)
  console.log('📧 User email addresses:', data.email_addresses?.length || 0)
  console.log('🎯 Primary email address ID:', data.primary_email_address_id)

  // Use primary_email_address_id if available, otherwise fall back to first email
  const primaryEmail = data.primary_email_address_id
    ? data.email_addresses.find(
        (email) => email.id === data.primary_email_address_id,
      )
    : data.email_addresses[0]

  if (!primaryEmail) {
    console.error('❌ No primary email found for user:', data.id)
    console.error('📧 Available emails:', data.email_addresses)
    console.error('🎯 Primary email ID:', data.primary_email_address_id)
    return
  }

  console.log('📧 Primary email:', primaryEmail.email_address)

  // Determine role from public metadata, default to USER
  const role = (data.public_metadata?.role as Role) ?? Role.USER
  console.log('🎭 User role:', role)

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

  console.log('💾 Creating user in database with data:', userData)

  try {
    const createdUser = await prisma.user.create({
      data: userData,
    })
    console.log('✅ User created successfully in database:', {
      id: createdUser.id,
      clerkId: createdUser.clerkId,
      email: createdUser.email,
      name: createdUser.name,
      role: createdUser.role,
    })
  } catch (error) {
    console.error('❌ Failed to create user in database:', error)
    console.error('📊 Error details:', {
      code: (error as Error & { code?: string })?.code,
      message: (error as Error)?.message,
      meta: (error as Error & { meta?: unknown })?.meta,
    })
    throw error // Re-throw to return 500 status
  }
}

async function handleUserUpdated(data: ClerkWebhookEvent['data']) {
  console.log('🔍 Processing user update for:', data.id)

  // Use primary_email_address_id if available, otherwise fall back to first email
  const primaryEmail = data.primary_email_address_id
    ? data.email_addresses.find(
        (email) => email.id === data.primary_email_address_id,
      )
    : data.email_addresses[0]

  if (!primaryEmail) {
    console.error('❌ No primary email found for user:', data.id)
    console.error('📧 Available emails:', data.email_addresses)
    console.error('🎯 Primary email ID:', data.primary_email_address_id)
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

  console.log('💾 Updating user in database with data:', updateData)

  try {
    const updatedUser = await prisma.user.update({
      where: { clerkId: data.id },
      data: updateData,
    })
    console.log('✅ User updated successfully in database:', updatedUser.id)
  } catch (error) {
    console.error('❌ Failed to update user in database:', error)
    throw error // Re-throw to return 500 status
  }
}

async function handleUserDeleted(data: ClerkWebhookEvent['data']) {
  console.log('🔍 Processing user deletion for:', data.id)

  try {
    await prisma.user.delete({
      where: { clerkId: data.id },
    })
    console.log('✅ User deleted successfully from database:', data.id)
  } catch (error) {
    console.error('❌ Failed to delete user from database:', error)
    throw error // Re-throw to return 500 status
  }
}
