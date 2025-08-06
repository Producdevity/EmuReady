import { auth } from '@clerk/nextjs/server'
import { type NextRequest, NextResponse } from 'next/server'
import { getCORSHeaders } from '@/lib/cors'
import { prisma } from '@/server/db'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401, headers: getCORSHeaders(request) },
      )
    }

    // Fetch user data from database using clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, name: true, role: true, bio: true, createdAt: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404, headers: getCORSHeaders(request) },
      )
    }

    return NextResponse.json({ user }, { headers: getCORSHeaders(request) })
  } catch (error) {
    console.error('Mobile auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCORSHeaders(request) },
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCORSHeaders(request),
  })
}
