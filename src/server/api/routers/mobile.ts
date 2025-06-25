import { AppError, ResourceError } from '@/lib/errors'
import {
  CreateCommentSchema,
  CreateListingSchema,
  DeleteCommentSchema,
  DeleteListingSchema,
  GetDevicesSchema,
  GetEmulatorsSchema,
  GetGameByIdSchema,
  GetGamesSchema,
  GetListingByIdSchema,
  GetListingCommentsSchema,
  GetListingsByGameSchema,
  GetListingsSchema,
  GetNotificationsSchema,
  GetUserListingsSchema,
  GetUserProfileSchema,
  GetUserVoteSchema,
  MarkNotificationReadSchema,
  SearchGamesSchema,
  SearchSuggestionsSchema,
  UpdateCommentSchema,
  UpdateListingSchema,
  UpdateProfileSchema,
  VoteListingSchema,
} from '@/schemas/mobile'
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc'
import { ApprovalStatus } from '@orm'

export const mobileRouter = createTRPCRouter({
  // Enhanced listings with pagination and filtering
  getListings: publicProcedure
    .input(GetListingsSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, gameId, systemId, deviceId, emulatorId, search } =
        input
      const skip = (page - 1) * limit

      // Build where clause without complex nested structures
      const baseWhere = {
        status: ApprovalStatus.APPROVED,
        game: { status: ApprovalStatus.APPROVED },
      }

      if (gameId) Object.assign(baseWhere, { gameId })
      if (deviceId) Object.assign(baseWhere, { deviceId })
      if (emulatorId) Object.assign(baseWhere, { emulatorId })
      if (systemId) Object.assign(baseWhere.game, { systemId })

      const [listings, total] = await Promise.all([
        ctx.prisma.listing.findMany({
          where: baseWhere,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            game: {
              include: {
                system: { select: { id: true, name: true, key: true } },
              },
            },
            device: {
              include: { brand: { select: { id: true, name: true } } },
            },
            emulator: { select: { id: true, name: true, logo: true } },
            performance: { select: { id: true, label: true, rank: true } },
            author: { select: { id: true, name: true } },
            _count: { select: { votes: true, comments: true } },
          },
        }),
        ctx.prisma.listing.count({ where: baseWhere }),
      ])

      // Filter by search on the results if needed
      const filteredListings = search
        ? listings.filter(
            (listing) =>
              listing.game.title.toLowerCase().includes(search.toLowerCase()) ||
              (listing.notes &&
                listing.notes.toLowerCase().includes(search.toLowerCase())),
          )
        : listings

      // Calculate success rates
      const listingsWithStats = await Promise.all(
        filteredListings.map(async (listing) => {
          const [upVotes, userVote] = await Promise.all([
            ctx.prisma.vote.count({
              where: { listingId: listing.id, value: true },
            }),
            ctx.session?.user.id
              ? ctx.prisma.vote.findUnique({
                  where: {
                    userId_listingId: {
                      userId: ctx.session.user.id,
                      listingId: listing.id,
                    },
                  },
                })
              : null,
          ])
          const downVotes = await ctx.prisma.vote.count({
            where: { listingId: listing.id, value: false },
          })
          const totalVotes = upVotes + downVotes
          const successRate = totalVotes > 0 ? (upVotes / totalVotes) * 100 : 0

          return {
            ...listing,
            successRate,
            userVote: userVote?.value ?? null,
          }
        }),
      )

      const adjustedTotal = search ? filteredListings.length : total
      const pages = Math.ceil(adjustedTotal / limit)

      return {
        listings: listingsWithStats,
        pagination: {
          total: adjustedTotal,
          pages,
          currentPage: page,
          limit,
          hasNextPage: page < pages,
          hasPreviousPage: page > 1,
        },
      }
    }),

  getFeaturedListings: publicProcedure.query(async ({ ctx }) => {
    const listings = await ctx.prisma.listing.findMany({
      where: {
        status: ApprovalStatus.APPROVED,
        game: { status: ApprovalStatus.APPROVED },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        game: {
          include: { system: { select: { id: true, name: true, key: true } } },
        },
        device: { include: { brand: { select: { id: true, name: true } } } },
        emulator: { select: { id: true, name: true, logo: true } },
        performance: { select: { id: true, label: true, rank: true } },
        author: { select: { id: true, name: true } },
        _count: { select: { votes: true, comments: true } },
      },
    })

    // Calculate success rate for each listing
    return await Promise.all(
      listings.map(async (listing) => {
        const [upVotes, userVote] = await Promise.all([
          ctx.prisma.vote.count({
            where: { listingId: listing.id, value: true },
          }),
          ctx.session?.user.id
            ? ctx.prisma.vote.findUnique({
                where: {
                  userId_listingId: {
                    userId: ctx.session.user.id,
                    listingId: listing.id,
                  },
                },
              })
            : null,
        ])
        const downVotes = await ctx.prisma.vote.count({
          where: { listingId: listing.id, value: false },
        })
        const totalVotes = upVotes + downVotes
        const successRate = totalVotes > 0 ? (upVotes / totalVotes) * 100 : 0

        return {
          ...listing,
          successRate,
          userVote: userVote?.value ?? null,
        }
      }),
    )
  }),

  // Enhanced games endpoint
  getGames: publicProcedure
    .input(GetGamesSchema)
    .query(async ({ ctx, input }) => {
      const { search, systemId, limit } = input

      const baseWhere = {
        status: ApprovalStatus.APPROVED,
      }

      if (systemId) Object.assign(baseWhere, { systemId })

      let games = await ctx.prisma.game.findMany({
        where: baseWhere,
        include: {
          system: { select: { id: true, name: true, key: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
        orderBy: [{ listings: { _count: 'desc' } }, { title: 'asc' }],
        take: search ? undefined : limit,
      })

      // Filter by search if provided
      if (search) {
        games = games
          .filter((game) =>
            game.title.toLowerCase().includes(search.toLowerCase()),
          )
          .slice(0, limit)
      }

      return games
    }),

  getPopularGames: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.game.findMany({
      where: { status: ApprovalStatus.APPROVED },
      include: {
        system: { select: { id: true, name: true, key: true } },
        _count: {
          select: { listings: { where: { status: ApprovalStatus.APPROVED } } },
        },
      },
      orderBy: { listings: { _count: 'desc' } },
      take: 20,
    })
  }),

  // Enhanced app stats
  getAppStats: publicProcedure.query(async ({ ctx }) => {
    const [
      totalListings,
      totalGames,
      totalDevices,
      totalEmulators,
      totalUsers,
    ] = await Promise.all([
      ctx.prisma.listing.count({ where: { status: ApprovalStatus.APPROVED } }),
      ctx.prisma.game.count({ where: { status: ApprovalStatus.APPROVED } }),
      ctx.prisma.device.count(),
      ctx.prisma.emulator.count(),
      ctx.prisma.user.count(),
    ])

    return {
      totalListings,
      totalGames,
      totalDevices,
      totalEmulators,
      totalUsers,
    }
  }),

  // Emulators endpoint
  getEmulators: publicProcedure
    .input(GetEmulatorsSchema)
    .query(async ({ ctx, input }) => {
      const { systemId, search, limit } = input

      let emulators = await ctx.prisma.emulator.findMany({
        include: {
          systems: { select: { id: true, name: true, key: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
        orderBy: [{ listings: { _count: 'desc' } }, { name: 'asc' }],
        take: search || systemId ? undefined : limit,
      })

      // Filter by search and/or systemId
      if (search || systemId) {
        emulators = emulators
          .filter((emulator) => {
            const matchesSearch =
              !search ||
              emulator.name.toLowerCase().includes(search.toLowerCase())
            const matchesSystem =
              !systemId ||
              emulator.systems.some((system) => system.id === systemId)
            return matchesSearch && matchesSystem
          })
          .slice(0, limit)
      }

      return emulators
    }),

  // Enhanced devices endpoint
  getDevices: publicProcedure
    .input(GetDevicesSchema)
    .query(async ({ ctx, input }) => {
      const { search, brandId, limit } = input

      const baseWhere = {}
      if (brandId) Object.assign(baseWhere, { brandId })

      let devices = await ctx.prisma.device.findMany({
        where: baseWhere,
        include: {
          brand: { select: { id: true, name: true } },
          soc: { select: { id: true, name: true, manufacturer: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
        orderBy: [{ brand: { name: 'asc' } }, { modelName: 'asc' }],
        take: search ? undefined : limit,
      })

      // Filter by search if provided
      if (search) {
        devices = devices
          .filter(
            (device) =>
              device.modelName.toLowerCase().includes(search.toLowerCase()) ||
              device.brand.name.toLowerCase().includes(search.toLowerCase()),
          )
          .slice(0, limit)
      }

      return devices
    }),

  // Device brands
  getDeviceBrands: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.deviceBrand.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
  }),

  // SOCs
  getSocs: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.soC.findMany({
      select: { id: true, name: true, manufacturer: true },
      orderBy: [{ manufacturer: 'asc' }, { name: 'asc' }],
    })
  }),

  // Performance scales
  getPerformanceScales: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.performanceScale.findMany({
      select: { id: true, label: true, rank: true },
      orderBy: { rank: 'asc' },
    })
  }),

  // Systems
  getSystems: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.system.findMany({
      select: { id: true, name: true, key: true },
      orderBy: { name: 'asc' },
    })
  }),

  // Search suggestions
  getSearchSuggestions: publicProcedure
    .input(SearchSuggestionsSchema)
    .query(async ({ ctx, input }) => {
      const { query, limit } = input
      const searchTerm = query.toLowerCase()

      const [games, devices, emulators] = await Promise.all([
        ctx.prisma.game.findMany({
          where: {
            status: ApprovalStatus.APPROVED,
          },
          select: { id: true, title: true, system: { select: { name: true } } },
          take: Math.ceil(limit * 2), // Get more to filter from
        }),
        ctx.prisma.device.findMany({
          select: {
            id: true,
            modelName: true,
            brand: { select: { name: true } },
          },
          take: Math.ceil(limit * 2),
        }),
        ctx.prisma.emulator.findMany({
          select: { id: true, name: true },
          take: Math.ceil(limit * 2),
        }),
      ])

      const suggestions = [
        ...games
          .filter((game) => game.title.toLowerCase().includes(searchTerm))
          .map((game) => ({
            id: game.id,
            title: game.title,
            type: 'game' as const,
            subtitle: game.system.name,
          })),
        ...devices
          .filter(
            (device) =>
              device.modelName.toLowerCase().includes(searchTerm) ||
              device.brand.name.toLowerCase().includes(searchTerm),
          )
          .map((device) => ({
            id: device.id,
            title: device.modelName,
            type: 'device' as const,
            subtitle: device.brand.name,
          })),
        ...emulators
          .filter((emulator) =>
            emulator.name.toLowerCase().includes(searchTerm),
          )
          .map((emulator) => ({
            id: emulator.id,
            title: emulator.name,
            type: 'emulator' as const,
          })),
      ]

      return suggestions.slice(0, limit)
    }),

  // Notifications
  getNotifications: protectedProcedure
    .input(GetNotificationsSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, unreadOnly } = input
      const skip = (page - 1) * limit

      const baseWhere = {
        userId: ctx.session.user.id,
      }

      if (unreadOnly) Object.assign(baseWhere, { isRead: false })

      const [notifications, total] = await Promise.all([
        ctx.prisma.notification.findMany({
          where: baseWhere,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            message: true,
            type: true,
            isRead: true,
            createdAt: true,
            actionUrl: true,
          },
        }),
        ctx.prisma.notification.count({ where: baseWhere }),
      ])

      const pages = Math.ceil(total / limit)

      return {
        notifications,
        pagination: {
          total,
          pages,
          currentPage: page,
          limit,
          hasNextPage: page < pages,
          hasPreviousPage: page > 1,
        },
      }
    }),

  getUnreadNotificationCount: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.notification.count({
      where: {
        userId: ctx.session.user.id,
        isRead: false,
      },
    })
  }),

  markNotificationAsRead: protectedProcedure
    .input(MarkNotificationReadSchema)
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.notificationId },
        select: { userId: true },
      })

      if (!notification) {
        throw AppError.notFound('Notification')
      }

      if (notification.userId !== ctx.session.user.id) {
        throw AppError.forbidden(
          'You can only mark your own notifications as read',
        )
      }

      await ctx.prisma.notification.update({
        where: { id: input.notificationId },
        data: { isRead: true },
      })

      return { success: true }
    }),

  markAllNotificationsAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notification.updateMany({
      where: {
        userId: ctx.session.user.id,
        isRead: false,
      },
      data: { isRead: true },
    })

    return { success: true }
  }),

  // Get user's vote on a listing
  getUserVote: protectedProcedure
    .input(GetUserVoteSchema)
    .query(async ({ ctx, input }) => {
      const vote = await ctx.prisma.vote.findUnique({
        where: {
          userId_listingId: {
            userId: ctx.session.user.id,
            listingId: input.listingId,
          },
        },
        select: { value: true },
      })

      return vote?.value ?? null
    }),

  // User preferences
  getUserPreferences: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        devicePreferences: {
          include: {
            device: {
              include: {
                brand: { select: { id: true, name: true } },
                soc: { select: { id: true, name: true, manufacturer: true } },
              },
            },
          },
        },
        socPreferences: {
          include: {
            soc: { select: { id: true, name: true, manufacturer: true } },
          },
        },
      },
    })

    if (!user) throw AppError.notFound('User')

    return {
      devicePreferences: user.devicePreferences,
      socPreferences: user.socPreferences,
    }
  }),

  // Existing endpoints...
  getListingsByGame: publicProcedure
    .input(GetListingsByGameSchema)
    .query(async ({ ctx, input }) => {
      const listings = await ctx.prisma.listing.findMany({
        where: { gameId: input.gameId, status: ApprovalStatus.APPROVED },
        include: {
          device: { include: { brand: { select: { id: true, name: true } } } },
          emulator: { select: { id: true, name: true, logo: true } },
          performance: { select: { id: true, label: true, rank: true } },
          author: { select: { id: true, name: true } },
          _count: { select: { votes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Calculate success rate for each listing
      return await Promise.all(
        listings.map(async (listing) => {
          const [upVotes, userVote] = await Promise.all([
            ctx.prisma.vote.count({
              where: { listingId: listing.id, value: true },
            }),
            ctx.session?.user.id
              ? ctx.prisma.vote.findUnique({
                  where: {
                    userId_listingId: {
                      userId: ctx.session.user.id,
                      listingId: listing.id,
                    },
                  },
                })
              : null,
          ])
          const downVotes = await ctx.prisma.vote.count({
            where: { listingId: listing.id, value: false },
          })
          const totalVotes = upVotes + downVotes
          const successRate = totalVotes > 0 ? (upVotes / totalVotes) * 100 : 0

          return {
            ...listing,
            successRate,
            userVote: userVote?.value ?? null,
          }
        }),
      )
    }),

  searchGames: publicProcedure
    .input(SearchGamesSchema)
    .query(async ({ ctx, input }) => {
      let games = await ctx.prisma.game.findMany({
        where: {
          status: ApprovalStatus.APPROVED,
        },
        include: {
          system: { select: { id: true, name: true, key: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
        take: 100, // Get more to filter from
      })

      // Filter by search
      games = games
        .filter((game) =>
          game.title.toLowerCase().includes(input.query.toLowerCase()),
        )
        .slice(0, 20)

      return games
    }),

  getGameById: publicProcedure.input(GetGameByIdSchema).query(
    async ({ ctx, input }) =>
      await ctx.prisma.game.findUnique({
        where: { id: input.gameId },
        include: {
          system: { select: { id: true, name: true, key: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
      }),
  ),

  getListingComments: publicProcedure.input(GetListingCommentsSchema).query(
    async ({ ctx, input }) =>
      await ctx.prisma.comment.findMany({
        where: { listingId: input.listingId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
  ),

  createComment: protectedProcedure.input(CreateCommentSchema).mutation(
    async ({ ctx, input }) =>
      await ctx.prisma.comment.create({
        data: {
          content: input.content,
          listingId: input.listingId,
          userId: ctx.session.user.id,
        },
        include: { user: { select: { id: true, name: true } } },
      }),
  ),

  voteListing: protectedProcedure
    .input(VoteListingSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user already voted
      const existingVote = await ctx.prisma.vote.findUnique({
        where: {
          userId_listingId: {
            userId: ctx.session.user.id,
            listingId: input.listingId,
          },
        },
      })

      return existingVote
        ? await ctx.prisma.vote.update({
            where: { id: existingVote.id },
            data: { value: input.value },
          })
        : await ctx.prisma.vote.create({
            data: {
              value: input.value,
              listingId: input.listingId,
              userId: ctx.session.user.id,
            },
          })
    }),

  getUserProfile: protectedProcedure
    .input(GetUserProfileSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          bio: true,
          createdAt: true,
          _count: {
            select: {
              listings: true,
              votes: true,
              comments: true,
            },
          },
        },
      })
    }),

  getUserListings: protectedProcedure.input(GetUserListingsSchema).query(
    async ({ ctx, input }) =>
      await ctx.prisma.listing.findMany({
        where: { authorId: input.userId },
        include: {
          game: {
            include: {
              system: { select: { id: true, name: true, key: true } },
            },
          },
          device: {
            include: { brand: { select: { id: true, name: true } } },
          },
          emulator: { select: { id: true, name: true, logo: true } },
          performance: { select: { id: true, label: true, rank: true } },
          _count: { select: { votes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
  ),

  getListingById: publicProcedure
    .input(GetListingByIdSchema)
    .query(async ({ ctx, input }) => {
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: input.id },
        include: {
          game: {
            include: {
              system: { select: { id: true, name: true, key: true } },
            },
          },
          device: { include: { brand: { select: { id: true, name: true } } } },
          emulator: { select: { id: true, name: true, logo: true } },
          performance: { select: { id: true, label: true, rank: true } },
          author: { select: { id: true, name: true } },
          _count: { select: { votes: true, comments: true } },
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

      if (!listing) return null

      // Calculate success rate and get user vote
      const [upVotes, userVote] = await Promise.all([
        ctx.prisma.vote.count({
          where: { listingId: listing.id, value: true },
        }),
        ctx.session?.user.id
          ? ctx.prisma.vote.findUnique({
              where: {
                userId_listingId: {
                  userId: ctx.session.user.id,
                  listingId: listing.id,
                },
              },
            })
          : null,
      ])
      const downVotes = await ctx.prisma.vote.count({
        where: { listingId: listing.id, value: false },
      })
      const totalVotes = upVotes + downVotes
      const successRate = totalVotes > 0 ? (upVotes / totalVotes) * 100 : 0

      return {
        ...listing,
        successRate,
        userVote: userVote?.value ?? null,
      }
    }),

  createListing: protectedProcedure
    .input(CreateListingSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.listing.create({
        data: {
          gameId: input.gameId,
          deviceId: input.deviceId,
          emulatorId: input.emulatorId,
          performanceId: input.performanceId,
          notes: input.notes,
          authorId: ctx.session.user.id,
          status: ApprovalStatus.PENDING,
          customFieldValues: input.customFieldValues
            ? {
                create: input.customFieldValues.map((cfv) => ({
                  customFieldDefinitionId: cfv.customFieldDefinitionId,
                  value: cfv.value,
                })),
              }
            : undefined,
        },
        include: {
          game: {
            include: {
              system: { select: { id: true, name: true, key: true } },
            },
          },
          device: { include: { brand: { select: { id: true, name: true } } } },
          emulator: { select: { id: true, name: true, logo: true } },
          performance: { select: { id: true, label: true, rank: true } },
          author: { select: { id: true, name: true } },
          _count: { select: { votes: true, comments: true } },
        },
      })
    }),

  updateListing: protectedProcedure
    .input(UpdateListingSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, customFieldValues, ...updateData } = input

      // Check if user owns the listing
      const existing = await ctx.prisma.listing.findUnique({
        where: { id },
        select: { authorId: true },
      })

      if (!existing) throw AppError.notFound('Listing')

      if (existing.authorId !== ctx.session.user.id) {
        throw AppError.forbidden('You can only edit your own listings')
      }

      return await ctx.prisma.listing.update({
        where: { id },
        data: {
          ...updateData,
          customFieldValues: customFieldValues
            ? {
                deleteMany: {},
                create: customFieldValues.map((cfv) => ({
                  customFieldDefinitionId: cfv.customFieldDefinitionId,
                  value: cfv.value,
                })),
              }
            : undefined,
        },
        include: {
          game: {
            include: {
              system: { select: { id: true, name: true, key: true } },
            },
          },
          device: { include: { brand: { select: { id: true, name: true } } } },
          emulator: { select: { id: true, name: true, logo: true } },
          performance: { select: { id: true, label: true, rank: true } },
          author: { select: { id: true, name: true } },
          _count: { select: { votes: true, comments: true } },
        },
      })
    }),

  deleteListing: protectedProcedure
    .input(DeleteListingSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user owns the listing
      const existing = await ctx.prisma.listing.findUnique({
        where: { id: input.id },
        select: { authorId: true },
      })

      if (!existing) throw AppError.notFound('Listing')

      if (existing.authorId !== ctx.session.user.id) {
        throw AppError.forbidden('You can only delete your own listings')
      }

      return await ctx.prisma.listing.delete({
        where: { id: input.id },
      })
    }),

  updateComment: protectedProcedure
    .input(UpdateCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user owns the comment
      const existing = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
        select: { userId: true },
      })

      if (!existing) throw ResourceError.comment.notFound()

      if (existing.userId !== ctx.session.user.id) {
        throw AppError.forbidden('You can only edit your own comments')
      }

      return await ctx.prisma.comment.update({
        where: { id: input.commentId },
        data: { content: input.content },
        include: { user: { select: { id: true, name: true } } },
      })
    }),

  deleteComment: protectedProcedure
    .input(DeleteCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user owns the comment
      const existing = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
        select: { userId: true },
      })

      if (!existing) throw ResourceError.comment.notFound()

      if (existing.userId !== ctx.session.user.id) {
        throw AppError.forbidden('You can only delete your own comments')
      }

      return await ctx.prisma.comment.delete({ where: { id: input.commentId } })
    }),

  updateProfile: protectedProcedure.input(UpdateProfileSchema).mutation(
    async ({ ctx, input }) =>
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          name: true,
          bio: true,
          createdAt: true,
        },
      }),
  ),
})
