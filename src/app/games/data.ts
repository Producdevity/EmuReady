import { prisma } from '@/server/db'

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
  return prisma.game.findUnique({
    where: { id },
    include: {
      system: true,
      listings: {
        include: {
          device: true,
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
}

export async function getSystemsList() {
  return prisma.system.findMany({
    orderBy: {
      name: 'asc',
    },
  })
} 