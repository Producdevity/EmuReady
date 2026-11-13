import { type Prisma } from '@orm'

export const bookmarkSelects = {
  listingBookmark: {
    id: true,
    createdAt: true,
    listing: {
      select: {
        id: true,
        createdAt: true,
        status: true,
        successRate: true,
        _count: { select: { votes: true, comments: true } },
        author: { select: { id: true, name: true, profileImage: true } },
        game: {
          select: {
            id: true,
            title: true,
            system: { select: { id: true, name: true, key: true } },
          },
        },
        device: {
          select: {
            id: true,
            modelName: true,
            brand: { select: { id: true, name: true } },
          },
        },
        emulator: { select: { id: true, name: true, logo: true } },
        performance: { select: { id: true, label: true, rank: true, description: true } },
      },
    },
  } satisfies Prisma.ListingBookmarkSelect,

  pcListingBookmark: {
    id: true,
    createdAt: true,
    pcListing: {
      select: {
        id: true,
        createdAt: true,
        status: true,
        successRate: true,
        _count: { select: { votes: true, comments: true } },
        author: { select: { id: true, name: true, profileImage: true } },
        game: {
          select: {
            id: true,
            title: true,
            system: { select: { id: true, name: true, key: true } },
          },
        },
        cpu: {
          select: {
            id: true,
            modelName: true,
            brand: { select: { id: true, name: true } },
          },
        },
        gpu: {
          select: {
            id: true,
            modelName: true,
            brand: { select: { id: true, name: true } },
          },
        },
        emulator: { select: { id: true, name: true, logo: true } },
        performance: { select: { id: true, label: true, rank: true, description: true } },
      },
    },
  } satisfies Prisma.PcListingBookmarkSelect,
} as const
