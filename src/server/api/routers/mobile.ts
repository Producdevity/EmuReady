import { AppError, ResourceError } from '@/lib/errors'
import {
  AddDevicePreferenceSchema,
  BulkUpdateDevicePreferencesSchema,
  BulkUpdateSocPreferencesSchema,
  CreateCommentSchema,
  CreateListingSchema,
  DeleteCommentSchema,
  DeleteListingSchema,
  GetDevicesSchema,
  GetEmulatorByIdSchema,
  GetEmulatorsSchema,
  GetGameByIdSchema,
  GetGamesSchema,
  GetListingByIdSchema,
  GetListingCommentsSchema,
  GetListingVerificationsSchema,
  GetListingsByGameSchema,
  GetListingsSchema,
  GetMyVerificationsSchema,
  GetNotificationsSchema,
  GetUserListingsSchema,
  GetUserProfileSchema,
  GetUserVoteSchema,
  IsVerifiedDeveloperSchema,
  MarkNotificationReadSchema,
  RemoveDevicePreferenceSchema,
  RemoveVerificationSchema,
  SearchGamesSchema,
  SearchSuggestionsSchema,
  UpdateCommentSchema,
  UpdateListingSchema,
  UpdateProfileSchema,
  UpdateUserPreferencesSchema,
  VerifyListingSchema,
  VoteListingSchema,
} from '@/schemas/mobile'
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc'
import { sanitizeBio } from '@/utils/sanitization'
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
            upVotes,
            downVotes,
            totalVotes,
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
          upVotes,
          downVotes,
          totalVotes,
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

  // Emulator details
  getEmulatorById: publicProcedure
    .input(GetEmulatorByIdSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.emulator.findUnique({
        where: { id: input.id },
        include: {
          systems: { select: { id: true, name: true, key: true } },
          _count: { select: { listings: true } },
        },
      })
    }),

  getDevices: publicProcedure
    .input(GetDevicesSchema)
    .query(async ({ ctx, input }) => {
      const baseWhere = {}
      if (input.brandId) Object.assign(baseWhere, { brandId: input.brandId })

      const devices = await ctx.prisma.device.findMany({
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
        take: input.search ? undefined : input.limit,
      })

      const searchTerm = input.search?.toLowerCase()

      // Filter by search if provided
      // TODO: do this in the query instead
      return searchTerm
        ? devices
            .filter((device) =>
              `${device.modelName} ${device.brand.name}`
                .toLowerCase()
                .includes(searchTerm),
            )
            .slice(0, input.limit)
        : devices
    }),

  getDeviceBrands: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.deviceBrand.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
  }),

  getSocs: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.soC.findMany({
      select: { id: true, name: true, manufacturer: true },
      orderBy: [{ manufacturer: 'asc' }, { name: 'asc' }],
    })
  }),

  getPerformanceScales: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.performanceScale.findMany({
      select: { id: true, label: true, rank: true },
      orderBy: { rank: 'asc' },
    })
  }),

  getSystems: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.system.findMany({
      select: { id: true, name: true, key: true, tgdbPlatformId: true },
      orderBy: { name: 'asc' },
    })
  }),

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
      defaultToUserDevices: user.defaultToUserDevices,
      defaultToUserSocs: user.defaultToUserSocs,
      notifyOnNewListings: user.notifyOnNewListings,
    }
  }),

  updateUserPreferences: protectedProcedure
    .input(UpdateUserPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) return ResourceError.user.notFound()

      // Sanitize bio if provided
      const updateData: {
        defaultToUserDevices?: boolean
        defaultToUserSocs?: boolean
        notifyOnNewListings?: boolean
        bio?: string
      } = {}

      if (input.defaultToUserDevices !== undefined) {
        updateData.defaultToUserDevices = input.defaultToUserDevices
      }
      if (input.defaultToUserSocs !== undefined) {
        updateData.defaultToUserSocs = input.defaultToUserSocs
      }
      if (input.notifyOnNewListings !== undefined) {
        updateData.notifyOnNewListings = input.notifyOnNewListings
      }
      if (input.bio !== undefined) {
        updateData.bio = sanitizeBio(input.bio)
      }

      return ctx.prisma.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true,
          bio: true,
          defaultToUserDevices: true,
          defaultToUserSocs: true,
          notifyOnNewListings: true,
        },
      })
    }),

  addDevicePreference: protectedProcedure
    .input(AddDevicePreferenceSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) return ResourceError.user.notFound()

      // Check if device exists
      const device = await ctx.prisma.device.findUnique({
        where: { id: input.deviceId },
      })

      if (!device) return ResourceError.device.notFound()

      // Check if preference already exists
      const existingPreference =
        await ctx.prisma.userDevicePreference.findUnique({
          where: {
            userId_deviceId: {
              userId: user.id,
              deviceId: input.deviceId,
            },
          },
        })

      if (existingPreference)
        return ResourceError.userDevicePreference.alreadyExists()

      return ctx.prisma.userDevicePreference.create({
        data: { userId: user.id, deviceId: input.deviceId },
        include: { device: { include: { brand: true, soc: true } } },
      })
    }),

  removeDevicePreference: protectedProcedure
    .input(RemoveDevicePreferenceSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) return ResourceError.user.notFound()

      const preference = await ctx.prisma.userDevicePreference.findUnique({
        where: {
          userId_deviceId: { userId: user.id, deviceId: input.deviceId },
        },
      })

      if (!preference) {
        return ResourceError.userDevicePreference.notInPreferences()
      }

      await ctx.prisma.userDevicePreference.delete({
        where: { id: preference.id },
      })

      return { success: true }
    }),

  bulkUpdateDevicePreferences: protectedProcedure
    .input(BulkUpdateDevicePreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) return ResourceError.user.notFound()

      // Validate all devices exist
      const devices = await ctx.prisma.device.findMany({
        where: { id: { in: input.deviceIds } },
      })

      if (devices.length !== input.deviceIds.length) {
        return ResourceError.userDevicePreference.notFound()
      }

      // Remove existing preferences
      await ctx.prisma.userDevicePreference.deleteMany({
        where: { userId: user.id },
      })

      // Add new preferences
      if (input.deviceIds.length > 0) {
        await ctx.prisma.userDevicePreference.createMany({
          data: input.deviceIds.map((deviceId) => ({
            userId: user.id,
            deviceId,
          })),
        })
      }

      // Return updated preferences
      return ctx.prisma.userDevicePreference.findMany({
        where: { userId: user.id },
        include: { device: { include: { brand: true, soc: true } } },
      })
    }),

  bulkUpdateSocPreferences: protectedProcedure
    .input(BulkUpdateSocPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) return ResourceError.user.notFound()

      // Validate all SOCs exist
      const socs = await ctx.prisma.soC.findMany({
        where: { id: { in: input.socIds } },
      })

      if (socs.length !== input.socIds.length) {
        return ResourceError.userSocPreference.notFound()
      }

      // Remove existing preferences
      await ctx.prisma.userSocPreference.deleteMany({
        where: { userId: user.id },
      })

      // Add new preferences
      if (input.socIds.length > 0) {
        await ctx.prisma.userSocPreference.createMany({
          data: input.socIds.map((socId) => ({
            userId: user.id,
            socId,
          })),
        })
      }

      // Return updated preferences
      return ctx.prisma.userSocPreference.findMany({
        where: { userId: user.id },
        include: { soc: true },
      })
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
            upVotes,
            downVotes,
            totalVotes,
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
        where: { id: input.id },
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
        upVotes,
        downVotes,
        totalVotes,
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

  // Verified Developers functionality
  getMyVerifiedEmulators: protectedProcedure.query(async ({ ctx }) => {
    const verifiedDevelopers = await ctx.prisma.verifiedDeveloper.findMany({
      where: { userId: ctx.session.user.id },
      include: { emulator: { select: { id: true, name: true, logo: true } } },
      orderBy: { verifiedAt: 'desc' },
    })

    return verifiedDevelopers.map((vd) => vd.emulator)
  }),

  isVerifiedDeveloper: protectedProcedure
    .input(IsVerifiedDeveloperSchema)
    .query(async ({ ctx, input }) => {
      const verifiedDeveloper = await ctx.prisma.verifiedDeveloper.findUnique({
        where: {
          userId_emulatorId: {
            userId: input.userId,
            emulatorId: input.emulatorId,
          },
        },
      })

      return !!verifiedDeveloper
    }),

  // Listing Verifications functionality
  verifyListing: protectedProcedure
    .input(VerifyListingSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, notes } = input
      const userId = ctx.session.user.id

      // Get the listing to check the emulator
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
        include: {
          emulator: { select: { id: true, name: true } },
          game: { select: { title: true } },
          author: { select: { name: true } },
        },
      })

      if (!listing) {
        throw AppError.notFound('Listing not found')
      }

      // Check if user is a verified developer for this emulator
      const verifiedDeveloper = await ctx.prisma.verifiedDeveloper.findUnique({
        where: {
          userId_emulatorId: {
            userId,
            emulatorId: listing.emulatorId,
          },
        },
      })

      if (!verifiedDeveloper) {
        throw AppError.forbidden(
          `You are not a verified developer for ${listing.emulator.name}`,
        )
      }

      // Check if already verified by this developer
      const existingVerification =
        await ctx.prisma.listingDeveloperVerification.findUnique({
          where: {
            listingId_verifiedBy: {
              listingId,
              verifiedBy: userId,
            },
          },
        })

      if (existingVerification) {
        throw AppError.conflict('You have already verified this listing')
      }

      const verification = await ctx.prisma.listingDeveloperVerification.create(
        {
          data: {
            listingId,
            verifiedBy: userId,
            notes,
          },
          include: {
            developer: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
      )

      return verification
    }),

  removeVerification: protectedProcedure
    .input(RemoveVerificationSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Find the verification and ensure it belongs to the current user
      const verification =
        await ctx.prisma.listingDeveloperVerification.findUnique({
          where: { id: input.verificationId },
        })

      if (!verification) {
        throw AppError.notFound('Verification not found')
      }

      if (verification.verifiedBy !== userId) {
        throw AppError.forbidden('You can only remove your own verifications')
      }

      await ctx.prisma.listingDeveloperVerification.delete({
        where: { id: input.verificationId },
      })

      return { message: 'Verification removed successfully' }
    }),

  getListingVerifications: protectedProcedure
    .input(GetListingVerificationsSchema)
    .query(async ({ ctx, input }) => {
      const verifications =
        await ctx.prisma.listingDeveloperVerification.findMany({
          where: { listingId: input.listingId },
          include: {
            developer: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
          orderBy: { verifiedAt: 'desc' },
        })

      return verifications
    }),

  getMyVerifications: protectedProcedure
    .input(GetMyVerificationsSchema)
    .query(async ({ ctx, input }) => {
      const { limit, page } = input ?? {}
      const actualLimit = limit ?? 20
      const actualPage = page ?? 1
      const skip = (actualPage - 1) * actualLimit
      const userId = ctx.session.user.id

      const [verifications, total] = await Promise.all([
        ctx.prisma.listingDeveloperVerification.findMany({
          where: { verifiedBy: userId },
          include: {
            listing: {
              include: {
                game: { select: { title: true } },
                emulator: { select: { name: true } },
                device: {
                  include: {
                    brand: { select: { name: true } },
                  },
                },
              },
            },
          },
          orderBy: { verifiedAt: 'desc' },
          skip,
          take: actualLimit,
        }),
        ctx.prisma.listingDeveloperVerification.count({
          where: { verifiedBy: userId },
        }),
      ])

      return {
        verifications,
        pagination: {
          page: actualPage,
          pages: Math.ceil(total / actualLimit),
          total,
          limit: actualLimit,
        },
      }
    }),

  // Trust system functionality
  getTrustLevels: protectedProcedure.query(async () => {
    const { TRUST_LEVELS } = await import('@/lib/trust/config')
    return TRUST_LEVELS
  }),
})
