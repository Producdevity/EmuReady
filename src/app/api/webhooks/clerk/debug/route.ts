import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'

export async function GET() {
  const debug: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET ? 'SET' : 'NOT_SET',
    databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
    clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      ? 'SET'
      : 'NOT_SET',
    clerkSecretKey: process.env.CLERK_SECRET_KEY ? 'SET' : 'NOT_SET',
  }

  try {
    // Test database connection
    await prisma.$connect()
    debug.databaseConnection = 'SUCCESS'

    // Test a simple query
    const userCount = await prisma.user.count()
    debug.userCount = userCount

    await prisma.$disconnect()
  } catch (error) {
    debug.databaseConnection = 'FAILED'
    debug.databaseError =
      error instanceof Error ? error.message : 'Unknown error'
  }

  return NextResponse.json(debug)
}
