import { Prisma } from '@orm'

export const USER_CONTRIBUTOR_SELECT = {
  id: true,
  name: true,
  profileImage: true,
  role: true,
  trustScore: true,
  bio: true,
  createdAt: true,
} satisfies Prisma.UserSelect

export const USER_OWN_PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  bio: true,
  profileImage: true,
  role: true,
  trustScore: true,
  createdAt: true,
  _count: { select: { listings: true } },
} satisfies Prisma.UserSelect

export const USER_LIMITED_PROFILE_SELECT = {
  id: true,
  name: true,
  profileImage: true,
  role: true,
  trustScore: true,
  createdAt: true,
  userBadges: {
    where: { badge: { isActive: true } },
    select: {
      id: true,
      assignedAt: true,
      color: true,
      badge: {
        select: { id: true, name: true, description: true, color: true, icon: true },
      },
    },
    orderBy: { assignedAt: Prisma.SortOrder.desc },
  },
  _count: {
    select: {
      listings: true,
      pcListings: true,
      submittedGames: true,
      votes: true,
      followers: true,
      following: true,
    },
  },
} satisfies Prisma.UserSelect

export const USER_PUBLIC_PROFILE_SELECT = {
  ...USER_LIMITED_PROFILE_SELECT,
  bio: true,
} satisfies Prisma.UserSelect

export function moderatorProfileSelect(now: Date) {
  return {
    ...USER_PUBLIC_PROFILE_SELECT,
    userBans: {
      where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      select: {
        id: true,
        reason: true,
        expiresAt: true,
        bannedBy: { select: { name: true } },
        createdAt: true,
      },
    },
  } satisfies Prisma.UserSelect
}

export const USER_PROFILE_REPORT_SELECT = {
  id: true,
  createdAt: true,
  status: true,
  successRate: true,
  _count: { select: { votes: true } },
  device: { select: { brand: { select: { id: true, name: true } }, modelName: true } },
  game: {
    select: { title: true, system: { select: { id: true, name: true, key: true } } },
  },
  emulator: { select: { name: true } },
  performance: { select: { label: true, rank: true, description: true } },
} satisfies Prisma.ListingSelect

export const USER_PROFILE_VOTE_SELECT = {
  id: true,
  value: true,
  createdAt: true,
  listing: {
    select: {
      id: true,
      device: {
        select: { brand: { select: { id: true, name: true } }, modelName: true },
      },
      game: {
        select: {
          title: true,
          system: { select: { id: true, name: true, key: true } },
        },
      },
      emulator: { select: { name: true } },
      performance: { select: { label: true, rank: true, description: true } },
    },
  },
} satisfies Prisma.VoteSelect

export const USER_PROFILE_PC_REPORT_SELECT = {
  id: true,
  createdAt: true,
  status: true,
  successRate: true,
  memorySize: true,
  os: true,
  osVersion: true,
  _count: { select: { votes: true } },
  cpu: { select: { modelName: true, brand: { select: { name: true } } } },
  gpu: { select: { modelName: true, brand: { select: { name: true } } } },
  game: {
    select: { title: true, system: { select: { id: true, name: true, key: true } } },
  },
  emulator: { select: { name: true } },
  performance: { select: { label: true, rank: true, description: true } },
} satisfies Prisma.PcListingSelect

export const USER_PROFILE_DEVICE_SELECT = {
  device: {
    select: { id: true, modelName: true, brand: { select: { name: true } } },
  },
} satisfies Prisma.ListingSelect

export const USER_PROFILE_EMULATOR_SELECT = {
  emulator: { select: { name: true } },
} satisfies Prisma.ListingSelect

export const USER_PROFILE_TRUST_ACTION_SELECT = {
  id: true,
  action: true,
  weight: true,
  createdAt: true,
} satisfies Prisma.TrustActionLogSelect

export const USER_UPDATE_SOURCE_SELECT = {
  id: true,
  email: true,
  clerkId: true,
} satisfies Prisma.UserSelect

export const USER_UPDATE_RESULT_SELECT = { id: true } satisfies Prisma.UserSelect

export const USER_ADMIN_LIST_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  trustScore: true,
  createdAt: true,
  _count: {
    select: {
      listings: true,
      votes: true,
      comments: true,
      followers: true,
      following: true,
    },
  },
} satisfies Prisma.UserSelect

export const USER_ROLE_TARGET_SELECT = { id: true, role: true } satisfies Prisma.UserSelect

export const USER_SEARCH_SELECT = {
  id: true,
  name: true,
  email: true,
  profileImage: true,
  role: true,
  trustScore: true,
} satisfies Prisma.UserSelect

export function profileAccessSelect(now: Date) {
  return {
    id: true,
    userBans: {
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true },
    },
    settings: {
      select: {
        profilePublic: true,
        showVotingActivity: true,
        allowFollows: true,
        allowFriendRequests: true,
        followersVisible: true,
        followingVisible: true,
      },
    },
  } satisfies Prisma.UserSelect
}
