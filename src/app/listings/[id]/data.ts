import { prisma } from '@/server/db'

export async function getListingById(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      game: { include: { system: true } },
      device: { include: { brand: true } },
      emulator: true,
      performance: true,
      author: {
        select: { id: true, name: true, email: true, profileImage: true },
      },
      customFieldValues: {
        include: {
          customFieldDefinition: true,
        },
        orderBy: {
          customFieldDefinition: {
            name: 'asc',
          },
        },
      },
      comments: {
        where: { parentId: null },
        include: {
          user: { select: { id: true, name: true } },
          replies: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { votes: true } },
      votes: false, // not needed for this page
    },
  })
}

export async function getListingUpVotes(listingId: string) {
  return prisma.vote.count({ where: { listingId, value: true } })
}

export async function getListingVotes(listingId: string, userId: string) {
  return prisma.vote.findMany({
    where: {
      listingId,
      userId,
    },
    select: {
      id: true,
      value: true,
    },
  })
}
