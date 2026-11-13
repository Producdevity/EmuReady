import { z } from 'zod'
import { PaginationResultSchema } from '@/schemas/pagination'
import { ApprovalStatus, PcOs, Role, TailwindColor, TrustAction } from '@orm'

const userIdentity = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  profileImage: z.string().nullable(),
  role: z.nativeEnum(Role),
  trustScore: z.number(),
})
const profileIdentity = userIdentity.extend({ createdAt: z.date(), bio: z.string().nullable() })
const pagination = PaginationResultSchema
const device = z.object({
  modelName: z.string(),
  brand: z.object({ id: z.string().uuid(), name: z.string() }),
})
const game = z.object({
  title: z.string(),
  system: z.object({ id: z.string().uuid(), name: z.string(), key: z.string().nullable() }),
})
const emulator = z.object({ name: z.string() })
const performance = z.object({
  label: z.string(),
  rank: z.number(),
  description: z.string().nullable(),
})
const report = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  status: z.nativeEnum(ApprovalStatus),
  successRate: z.number(),
  _count: z.object({ votes: z.number() }),
  game,
  emulator,
  performance,
})
const hardware = z.object({ modelName: z.string(), brand: z.object({ name: z.string() }) })
const badge = z.object({
  id: z.string().uuid(),
  assignedAt: z.date(),
  color: z.nativeEnum(TailwindColor),
  badge: z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    color: z.string(),
    icon: z.string().nullable(),
  }),
})
const contribution = z.object({
  listings: z.number(),
  pcListings: z.number(),
  games: z.number(),
  total: z.number(),
  lastContributionAt: z.date().nullable(),
})
const contributor = userIdentity.extend({
  rank: z.number(),
  bio: z.string().nullable(),
  joinedAt: z.date(),
  contributions: contribution,
  lifetime: contribution,
})

export const UserSessionOutputSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    role: z.nativeEnum(Role),
    permissions: z.array(z.string()),
  })
  .nullable()

export const OwnUserProfileOutputSchema = profileIdentity.extend({
  email: z.string(),
  _count: z.object({ listings: z.number() }),
})

export const UserPrivacySettingsSchema = z.object({
  profilePublic: z.boolean(),
  showVotingActivity: z.boolean(),
  allowFollows: z.boolean(),
  allowFriendRequests: z.boolean(),
  followersVisible: z.boolean(),
  followingVisible: z.boolean(),
})

export const PublicUserProfileOutputSchema = profileIdentity
  .merge(UserPrivacySettingsSchema)
  .extend({
    limitedProfile: z.literal(true).optional(),
    userBadges: z.array(badge),
    userBans: z
      .array(
        z.object({
          id: z.string().uuid(),
          reason: z.string(),
          expiresAt: z.date().nullable(),
          bannedBy: z.object({ name: z.string().nullable() }).nullable(),
          createdAt: z.date(),
        }),
      )
      .optional(),
    _count: z.object({
      listings: z.number(),
      pcListings: z.number(),
      submittedGames: z.number(),
      votes: z.number(),
      followers: z.number(),
      following: z.number(),
    }),
    listings: z.object({ items: z.array(report.extend({ device })), pagination }),
    pcListings: z.object({
      items: z.array(
        report.extend({
          cpu: hardware,
          gpu: hardware.nullable(),
          memorySize: z.number(),
          os: z.nativeEnum(PcOs),
          osVersion: z.string(),
        }),
      ),
      pagination,
    }),
    votes: z.object({
      items: z.array(
        z.object({
          id: z.string().uuid(),
          value: z.boolean(),
          createdAt: z.date(),
          listing: z.object({ id: z.string().uuid(), device, game, emulator, performance }),
        }),
      ),
      pagination,
    }),
    trustActionLogs: z.object({
      items: z.array(
        z.object({
          id: z.string().uuid(),
          action: z.nativeEnum(TrustAction),
          weight: z.number(),
          createdAt: z.date(),
        }),
      ),
      pagination,
    }),
    filterOptions: z.object({
      devices: z.array(z.object({ id: z.string().uuid(), label: z.string() })),
      emulators: z.array(z.string()),
    }),
    contributionSummary: contribution.nullable(),
    voteSummary: z
      .object({ total: z.number(), upvotes: z.number(), downvotes: z.number() })
      .nullable(),
  })

export const TopContributorsOutputSchema = z.object({
  allTime: z.array(contributor),
  thisMonth: z.array(contributor),
  thisWeek: z.array(contributor),
})

export const AdminUsersOutputSchema = z.object({
  users: z.array(
    userIdentity.omit({ profileImage: true }).extend({
      email: z.string(),
      createdAt: z.date(),
      _count: z.object({
        listings: z.number(),
        votes: z.number(),
        comments: z.number(),
        followers: z.number(),
        following: z.number(),
      }),
    }),
  ),
  pagination,
})

export const UserStatisticsOutputSchema = z.object({
  total: z.number(),
  byRole: z.object({
    user: z.number(),
    author: z.number(),
    developer: z.number(),
    moderator: z.number(),
    admin: z.number(),
    superAdmin: z.number(),
  }),
  bannedUsers: z.number(),
})

export const SearchUsersOutputSchema = z.array(userIdentity.extend({ email: z.string() }))
export const VerifiedDeveloperOutputSchema = z.boolean()

export const UserSocialOverviewOutputSchema = z.object({
  counts: z.object({
    followers: z.number(),
    following: z.number(),
    friends: z.number(),
    blocking: z.number(),
    blockedBy: z.number(),
    pendingFriendRequestsSent: z.number(),
    pendingFriendRequestsReceived: z.number(),
  }),
  rateIndicators: z.object({
    followsSentLast24h: z.number(),
    followsSentLast7d: z.number(),
    followsReceivedLast24h: z.number(),
    followsReceivedLast7d: z.number(),
    friendRequestsSentLast24h: z.number(),
    friendRequestsSentLast7d: z.number(),
  }),
})

export const UserSocialListOutputSchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), user: userIdentity, date: z.date() })),
  pagination,
})
