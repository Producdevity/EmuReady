import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '@/server/auth'
import { prisma } from '@/server/db'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      {
        authenticated: false,
        message: 'Not authenticated',
      },
      { status: 401 },
    )
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true },
    })

    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
          sessionExists: true,
          userExists: false,
          sessionUserId: session.user.id,
          message: "User ID in session doesn't exist in database",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      session: session,
    })
  } catch (error) {
    console.error('Error checking user:', error)
    return NextResponse.json(
      {
        authenticated: false,
        error: String(error),
        message: 'Error checking session',
      },
      { status: 500 },
    )
  }
}
