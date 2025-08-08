import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'

export async function GET() {
  try {
    // Get authenticated user
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all user data
    const [
      user,
      listings,
      pcListings,
      comments,
      votes,
      commentVotes,
      devices,
      notifications,
    ] = await Promise.all([
      // User profile
      prisma.user.findUnique({
        where: { clerkId: userId },
        select: {
          id: true,
          clerkId: true,
          name: true,
          email: true,
          profileImage: true,
          role: true,
          bio: true,
          createdAt: true,
          trustScore: true,
          // Don't include sensitive data like permissions
        },
      }),
      // User's listings
      prisma.listing.findMany({
        where: { author: { clerkId: userId } },
        include: {
          game: { select: { title: true } },
          device: { include: { brand: { select: { name: true } } } },
          emulator: { select: { name: true } },
          performance: { select: { label: true, rank: true } },
        },
      }),
      // User's PC listings
      prisma.pcListing.findMany({
        where: { author: { clerkId: userId } },
        include: {
          game: { select: { title: true } },
          emulator: { select: { name: true } },
          performance: { select: { label: true, rank: true } },
        },
      }),
      // User's comments
      prisma.comment.findMany({
        where: { user: { clerkId: userId } },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          listing: { select: { id: true, game: { select: { title: true } } } },
        },
      }),
      // User's votes on listings
      prisma.vote.findMany({
        where: { user: { clerkId: userId } },
        select: {
          id: true,
          value: true,
          listing: { select: { id: true, game: { select: { title: true } } } },
        },
      }),
      // User's votes on comments
      prisma.commentVote.findMany({
        where: { user: { clerkId: userId } },
        select: {
          id: true,
          value: true,
          createdAt: true,
          comment: { select: { id: true, content: true } },
        },
      }),
      // User's devices - Note: Device model doesn't have an addedBy field
      // so we'll skip this for now
      Promise.resolve([]),
      // User's notifications
      prisma.notification.findMany({
        where: { userId: userId },
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          actionUrl: true,
          isRead: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100, // Limit to last 100 notifications
      }),
    ])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Compile all data into a structured format
    const exportData = {
      exportDate: new Date().toISOString(),
      userData: {
        profile: user,
        statistics: {
          totalListings: listings.length,
          totalPcListings: pcListings.length,
          totalComments: comments.length,
          totalVotes: votes.length,
          totalCommentVotes: commentVotes.length,
          totalDevicesAdded: devices.length,
        },
      },
      content: {
        listings,
        pcListings,
        comments,
        votes,
        commentVotes,
        devicesAdded: devices,
        notifications,
      },
    }

    // Return as JSON file download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="emuready-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 },
    )
  }
}
