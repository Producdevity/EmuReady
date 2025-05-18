import { prisma } from '@/server/db'
import { isUuid } from '@/utils/validation'

export async function getAllGames() {
  return prisma.game.findMany({
    include: {
      system: true,
      _count: {
        select: {
          listings: true,
        },
      },
    },
    orderBy: {
      title: 'asc',
    },
  })
}

export async function getGameById(id: string) {
  // Validate that the ID is a properly formatted UUID
  if (!id || !isUuid(id)) {
    console.error(`Invalid game ID format: ${id}`)
    return null
  }

  try {
    return await prisma.game.findUnique({
      where: { id },
      include: {
        system: true,
        listings: {
          include: {
            device: {
              include: {
                brand: true,
              },
            },
            emulator: true,
            performance: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                votes: true,
                comments: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })
  } catch (error) {
    console.error(`Error fetching game with ID ${id}:`, error)
    return null
  }
}

export async function getSystemsList() {
  return prisma.system.findMany({
    orderBy: {
      name: 'asc',
    },
  })
}
