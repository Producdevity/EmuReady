import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { syncAllRolesToClerk } from '@/server/utils/roleSync'
import { Role } from '@orm'
import type { NextRequest } from 'next/server'

export async function POST(_request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user in database to check role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })

    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 },
      )
    }

    // Sync all roles
    await syncAllRolesToClerk()

    return NextResponse.json({
      success: true,
      message: 'All roles synced to Clerk successfully',
    })
  } catch (error) {
    console.error('Failed to sync roles:', error)
    return NextResponse.json({ error: 'Failed to sync roles' }, { status: 500 })
  }
}
