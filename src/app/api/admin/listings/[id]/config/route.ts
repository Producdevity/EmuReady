import { auth } from '@clerk/nextjs/server'
import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { generateEmulatorConfig } from '@/server/utils/emulator-config/emulator-detector'
import { roleIncludesRole } from '@/utils/permission-system'
import { Role } from '@orm'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  const params = await props.params

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user info first
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const listingId = params.id

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        game: {
          select: {
            id: true,
            title: true,
            system: { select: { id: true, name: true, key: true } },
          },
        },
        emulator: { select: { id: true, name: true } },
        customFieldValues: {
          include: {
            customFieldDefinition: {
              select: {
                id: true,
                name: true,
                label: true,
                type: true,
                options: true,
              },
            },
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Check permissions now that we have the listing and emulator info
    const isAdmin = roleIncludesRole(user.role, Role.ADMIN)
    const isDeveloper = roleIncludesRole(user.role, Role.DEVELOPER)

    if (!isAdmin && !isDeveloper) {
      return NextResponse.json(
        { error: 'Admin or Developer access required' },
        { status: 403 },
      )
    }

    // For developers, verify they can access this emulator's config
    if (isDeveloper && !isAdmin) {
      const verifiedDeveloper = await prisma.verifiedDeveloper.findUnique({
        where: {
          userId_emulatorId: {
            userId: user.id,
            emulatorId: listing.emulatorId,
          },
        },
      })

      if (!verifiedDeveloper) {
        return NextResponse.json(
          {
            error:
              'You can only view configs for emulators you are verified for',
          },
          { status: 403 },
        )
      }
    }

    // Generate config using the emulator detector
    const configResult = generateEmulatorConfig({
      listingId: listing.id,
      gameId: listing.game.id,
      emulatorName: listing.emulator.name,
      customFieldValues: listing.customFieldValues.map((cfv) => ({
        customFieldDefinition: cfv.customFieldDefinition,
        value: cfv.value,
      })),
    })

    const response = {
      listing: {
        id: listing.id,
        game: listing.game.title,
        system: listing.game.system.name,
        emulator: listing.emulator.name,
      },
      config: {
        type: configResult.type,
        filename: configResult.filename,
        content: configResult.serialized,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating config:', error)
    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to generate config' },
      { status: 500 },
    )
  }
}
