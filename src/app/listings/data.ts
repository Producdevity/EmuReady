import { prisma } from '@/server/db'
import type { Prisma } from '@orm'

export async function getAllListings(params: {
  search?: string
  systemId?: string
  deviceId?: string
  emulatorId?: string
  performanceId?: number
  page?: number
  pageSize?: number
}) {
  const {
    search,
    systemId,
    deviceId,
    emulatorId,
    performanceId,
    page = 1,
    pageSize = 12,
  } = params

  const where: Prisma.ListingWhereInput = {}

  // Add filters
  if (search) {
    where.OR = [
      { game: { title: { contains: search, mode: 'insensitive' } } },
      { notes: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (systemId) {
    where.game = { systemId }
  }

  if (deviceId) {
    where.deviceId = deviceId
  }

  if (emulatorId) {
    where.emulatorId = emulatorId
  }

  if (performanceId) {
    where.performanceId = performanceId
  }

  // Count total matching records for pagination
  const total = await prisma.listing.count({ where })
  
  // Fetch paginated records with all needed relations
  const listings = await prisma.listing.findMany({
    where,
    include: {
      game: {
        include: {
          system: true,
        },
      },
      device: true,
      emulator: true,
      performance: true,
      author: {
        select: {
          id: true,
          name: true,
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
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  // Calculate pagination info
  const totalPages = Math.ceil(total / pageSize)
  
  return {
    listings,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  }
} 