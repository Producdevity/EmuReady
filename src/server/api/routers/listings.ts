import { TRPCError } from '@trpc/server'
import { Prisma, ListingApprovalStatus } from '@orm'
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  authorProcedure,
  adminProcedure,
  superAdminProcedure,
} from '@/server/api/trpc'
import {
  ApproveListingSchema,
  CreateCommentSchema,
  CreateListingSchema,
  CreateVoteComment,
  CreateVoteSchema,
  DeleteCommentSchema,
  DeleteListingSchema,
  EditCommentSchema,
  GetSortedCommentsSchema,
  GetProcessedSchema,
  OverrideApprovalStatusSchema,
  RejectListingSchema,
  GetListingsSchema,
  GetListingByIdSchema,
  GetCommentsSchema,
} from '@/schemas/listing'

export const listingsRouter = createTRPCRouter({
  get: publicProcedure
    .input(GetListingsSchema)
    .query(async ({ ctx, input }) => {
      const {
        systemId,
        deviceId,
        emulatorId,
        performanceId,
        searchTerm,
        page,
        limit,
        sortField,
        sortDirection,
        approvalStatus,
      } = input
      const skip = (page - 1) * limit

      const gameFilter: Prisma.GameWhereInput = {}
      if (systemId) {
        gameFilter.systemId = systemId
      }

      const filters: Prisma.ListingWhereInput = {
        ...(deviceId ? { deviceId } : {}),
        ...(emulatorId ? { emulatorId } : {}),
        ...(performanceId ? { performanceId } : {}),
        ...(approvalStatus
          ? { status: approvalStatus }
          : { status: ListingApprovalStatus.APPROVED }),
      }

      if (searchTerm) {
        filters.OR = [
          Object.keys(gameFilter).length
            ? {
                game: {
                  is: {
                    ...gameFilter,
                    title: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              }
            : {
                game: {
                  is: {
                    title: {
                      contains: searchTerm,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              },
          {
            notes: { contains: searchTerm, mode: Prisma.QueryMode.insensitive },
          },
        ]
      } else if (Object.keys(gameFilter).length) {
        filters.game = { is: gameFilter }
      }

      const total = await ctx.prisma.listing.count({ where: filters })

      // Build orderBy based on sortField and sortDirection
      const orderBy: Prisma.ListingOrderByWithRelationInput[] = []

      if (sortField && sortDirection) {
        switch (sortField) {
          case 'game.title':
            orderBy.push({ game: { title: sortDirection } })
            break
          case 'game.system.name':
            orderBy.push({ game: { system: { name: sortDirection } } })
            break
          case 'device':
            orderBy.push({ device: { brand: { name: sortDirection } } })
            orderBy.push({ device: { modelName: sortDirection } })
            break
          case 'emulator.name':
            orderBy.push({ emulator: { name: sortDirection } })
            break
          case 'performance.label':
            orderBy.push({ performance: { label: sortDirection } })
            break
          case 'author.name':
            orderBy.push({ author: { name: sortDirection } })
            break
          case 'createdAt':
            orderBy.push({ createdAt: sortDirection })
            break
          // 'successRate' will be handled after fetching the data
        }
      }

      // Default ordering if no sort specified or for secondary sort
      if (!orderBy.length || sortField !== 'createdAt') {
        orderBy.push({ createdAt: 'desc' })
      }

      const listings = await ctx.prisma.listing.findMany({
        where: filters,
        include: {
          game: {
            include: {
              system: true,
            },
          },
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
          votes: ctx.session
            ? {
                where: {
                  userId: ctx.session.user.id,
                },
                select: {
                  value: true,
                },
              }
            : undefined,
        },
        orderBy,
        skip,
        take: limit,
      })

      // For each listing calculate success rate
      const listingsWithStats = await Promise.all(
        listings.map(async (listing) => {
          // Count upvotes
          const upVotes = await ctx.prisma.vote.count({
            where: {
              listingId: listing.id,
              value: true,
            },
          })

          const totalVotes = listing._count.votes
          const successRate = totalVotes > 0 ? upVotes / totalVotes : 0

          const userVote =
            ctx.session && listing.votes.length > 0
              ? listing.votes[0].value
              : null

          return {
            ...listing,
            successRate,
            userVote,
            // Remove the raw votes array from the response
            votes: undefined,
          }
        }),
      )

      // Handle sorting by success rate since it's calculated after the database query
      if (sortField === 'successRate' && sortDirection) {
        listingsWithStats.sort((a, b) => {
          return sortDirection === 'asc'
            ? a.successRate - b.successRate
            : b.successRate - a.successRate
        })
      }

      return {
        listings: listingsWithStats,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      }
    }),

  byId: publicProcedure
    .input(GetListingByIdSchema)
    .query(async ({ ctx, input }) => {
      const { id } = input

      const listing = await ctx.prisma.listing.findUnique({
        where: { id },
        include: {
          game: {
            include: {
              system: true,
            },
          },
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
          comments: {
            where: {
              parentId: null,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
              replies: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              votes: true,
            },
          },
          votes: ctx.session
            ? {
                where: {
                  userId: ctx.session.user.id,
                },
              }
            : undefined,
        },
      })

      if (!listing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Listing not found',
        })
      }

      // Count upvotes
      const upVotes = await ctx.prisma.vote.count({
        where: {
          listingId: listing.id,
          value: true,
        },
      })

      const successRate =
        listing._count.votes > 0 ? upVotes / listing._count.votes : 0

      const userVote =
        ctx.session && listing.votes.length > 0 ? listing.votes[0].value : null

      return {
        ...listing,
        successRate,
        userVote,
        // Remove the raw votes array from the response
        votes: undefined,
      }
    }),

  create: authorProcedure
    .input(CreateListingSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        gameId,
        deviceId,
        emulatorId,
        performanceId,
        notes,
        customFieldValues,
      } = input
      const authorId = ctx.session.user.id

      console.log('Attempting to create listing with authorId:', authorId)
      const userExists = await ctx.prisma.user.findUnique({
        where: { id: authorId },
        select: { id: true },
      })

      if (!userExists) {
        console.error(
          'CRITICAL: User with session ID not found in database:',
          authorId,
        )
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `User with ID ${authorId} not found. Cannot create listing.`,
        })
      }

      const existingListing = await ctx.prisma.listing.findFirst({
        where: {
          gameId,
          deviceId,
          emulatorId,
        },
      })

      if (existingListing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message:
            'A listing for this game, device, and emulator combination already exists',
        })
      }

      return ctx.prisma.$transaction(async (tx) => {
        const newListing = await tx.listing.create({
          data: {
            gameId,
            deviceId,
            emulatorId,
            performanceId,
            notes,
            authorId: authorId,
            status: ListingApprovalStatus.PENDING,
          },
        })

        if (customFieldValues && customFieldValues.length > 0) {
          for (const cfv of customFieldValues) {
            // Validate the customFieldDefinitionId exists and belongs to the emulator for this listing
            const fieldDef = await tx.customFieldDefinition.findUnique({
              where: { id: cfv.customFieldDefinitionId },
            })
            if (!fieldDef || fieldDef.emulatorId !== emulatorId) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Invalid custom field definition ID: ${cfv.customFieldDefinitionId} for emulator ${emulatorId}`,
              })
            }
            // TODO: Add more specific validation for cfv.value based on fieldDef.type if needed here
            // For now, assuming client sends compatible JSON structure
            await tx.listingCustomFieldValue.create({
              data: {
                listingId: newListing.id,
                customFieldDefinitionId: cfv.customFieldDefinitionId,
                value:
                  cfv.value === null
                    ? Prisma.JsonNull
                    : (cfv.value as Prisma.InputJsonValue),
              },
            })
          }
        }
        return newListing
      })
    }),

  vote: protectedProcedure
    .input(CreateVoteSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, value } = input

      const userId = ctx.session.user.id

      const listing = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
      })

      if (!listing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Listing not found',
        })
      }

      // Verify user exists in database
      const userExists = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      if (!userExists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `User with ID ${userId} does not exist in database`,
        })
      }

      // Check if user already voted
      const existingVote = await ctx.prisma.vote.findUnique({
        where: {
          userId_listingId: {
            userId,
            listingId,
          },
        },
      })

      if (existingVote) {
        // If value is the same, remove the vote (toggle)
        if (existingVote.value === value) {
          await ctx.prisma.vote.delete({
            where: {
              userId_listingId: {
                userId,
                listingId,
              },
            },
          })
          return { message: 'Vote removed' }
        }

        // Otherwise update the existing vote
        return ctx.prisma.vote.update({
          where: {
            userId_listingId: {
              userId,
              listingId,
            },
          },
          data: {
            value,
          },
        })
      }

      // Create new vote
      return ctx.prisma.vote.create({
        data: {
          value,
          userId,
          listingId,
        },
      })
    }),

  createComment: protectedProcedure
    .input(CreateCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, content, parentId } = input

      // Get user ID from session
      const userId = ctx.session.user.id

      // Check if listing exists
      const listing = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
      })

      if (!listing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Listing not found',
        })
      }

      // If parentId is provided, check if parent comment exists
      if (parentId) {
        const parentComment = await ctx.prisma.comment.findUnique({
          where: { id: parentId },
        })

        if (!parentComment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Parent comment not found',
          })
        }
      }

      const userExists = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      if (!userExists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `User with ID ${userId} does not exist in database`,
        })
      }

      return ctx.prisma.comment.create({
        data: {
          content,
          userId,
          listingId,
          parentId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    }),

  delete: adminProcedure
    .input(DeleteListingSchema)
    .mutation(async ({ ctx, input }) => {
      const { id } = input

      const listing = await ctx.prisma.listing.findUnique({ where: { id } })

      if (!listing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Listing not found',
        })
      }

      await ctx.prisma.listing.delete({ where: { id } })

      return { success: true }
    }),

  performanceScales: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.performanceScale.findMany({ orderBy: { rank: 'asc' } })
  }),

  getComments: publicProcedure
    .input(GetCommentsSchema)
    .query(async ({ ctx, input }) => {
      const { listingId } = input

      const comments = await ctx.prisma.comment.findMany({
        where: {
          listingId,
          parentId: null, // Only get top-level comments
          deletedAt: null, // Don't show soft-deleted comments
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          replies: {
            where: {
              deletedAt: null, // Don't show soft-deleted replies
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return { comments }
    }),

  // Edit a comment
  editComment: protectedProcedure
    .input(EditCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { commentId, content } = input
      const userId = ctx.session.user.id

      const comment = await ctx.prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          user: {
            select: {
              id: true,
            },
          },
        },
      })

      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        })
      }

      if (comment.deletedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot edit a deleted comment',
        })
      }

      const canEdit =
        comment.user.id === userId || ctx.session.user.role === 'SUPER_ADMIN'
      if (!canEdit) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to edit this comment',
        })
      }

      return ctx.prisma.comment.update({
        where: { id: commentId },
        data: {
          content,
          isEdited: true,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      })
    }),

  deleteComment: protectedProcedure
    .input(DeleteCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const { commentId } = input
      const userId = ctx.session.user.id

      const comment = await ctx.prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          user: {
            select: {
              id: true,
            },
          },
        },
      })

      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        })
      }

      if (comment.deletedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Comment is already deleted',
        })
      }

      const canDelete =
        comment.user.id === userId ||
        ctx.session.user.role === 'ADMIN' ||
        ctx.session.user.role === 'SUPER_ADMIN'

      if (!canDelete) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this comment',
        })
      }

      return ctx.prisma.comment.update({
        where: { id: commentId },
        data: {
          deletedAt: new Date(),
        },
      })
    }),

  getSortedComments: publicProcedure
    .input(GetSortedCommentsSchema)
    .query(async ({ ctx, input }) => {
      const { listingId, sortBy } = input

      // Build appropriate order by clause based on sort selection
      let orderBy: Prisma.CommentOrderByWithRelationInput

      switch (sortBy) {
        case 'newest':
          orderBy = { createdAt: 'desc' }
          break
        case 'oldest':
          orderBy = { createdAt: 'asc' }
          break
        case 'popular':
          orderBy = { score: 'desc' }
          break
        default:
          orderBy = { createdAt: 'desc' }
      }

      // Get all top-level comments
      const comments = await ctx.prisma.comment.findMany({
        where: {
          listingId,
          parentId: null, // Only get top-level comments
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true,
                },
              },
              _count: {
                select: {
                  replies: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy,
      })

      // Get all comment votes for the user if logged in
      let userCommentVotes: Record<string, boolean> = {}

      if (ctx.session?.user) {
        const votes = await ctx.prisma.commentVote.findMany({
          where: {
            userId: ctx.session.user.id,
            comment: {
              listingId,
            },
          },
          select: {
            commentId: true,
            value: true,
          },
        })

        // Create a lookup map of commentId -> vote value
        userCommentVotes = votes.reduce(
          (acc, vote) => {
            acc[vote.commentId] = vote.value
            return acc
          },
          {} as Record<string, boolean>,
        )
      }

      // Transform the comments to include vote data
      const transformedComments = comments.map((comment) => {
        // Process replies
        const transformedReplies = comment.replies.map((reply) => {
          return {
            ...reply,
            userVote: userCommentVotes[reply.id] ?? null,
            replyCount: reply._count.replies,
          }
        })

        return {
          ...comment,
          userVote: userCommentVotes[comment.id] ?? null,
          replyCount: comment._count.replies,
          replies: transformedReplies,
        }
      })

      return { comments: transformedComments }
    }),

  voteComment: protectedProcedure
    .input(CreateVoteComment)
    .mutation(async ({ ctx, input }) => {
      const { commentId, value } = input
      const userId = ctx.session.user.id

      // Check if comment exists
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: commentId },
      })

      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        })
      }

      // Check if user already voted on this comment
      const existingVote = await ctx.prisma.commentVote.findUnique({
        where: {
          userId_commentId: {
            userId,
            commentId,
          },
        },
      })

      // Start a transaction to handle both the vote and score update
      return ctx.prisma.$transaction(async (tx) => {
        let voteResult
        let scoreChange: number

        if (existingVote) {
          // If vote is the same, remove the vote (toggle)
          if (existingVote.value === value) {
            await tx.commentVote.delete({
              where: {
                userId_commentId: {
                  userId,
                  commentId,
                },
              },
            })

            // Update score: if removing upvote, decrement score, if removing downvote, increment score
            scoreChange = existingVote.value ? -1 : 1
            voteResult = { message: 'Vote removed' }
          } else {
            voteResult = await tx.commentVote.update({
              where: {
                userId_commentId: {
                  userId,
                  commentId,
                },
              },
              data: { value },
            })

            // Update score: changing from downvote to upvote = +2, from upvote to downvote = -2
            scoreChange = value ? 2 : -2
          }
        } else {
          voteResult = await tx.commentVote.create({
            data: {
              userId,
              commentId,
              value,
            },
          })

          // Update score: +1 for upvote, -1 for downvote
          scoreChange = value ? 1 : -1
        }

        // Update the comment score
        await tx.comment.update({
          where: { id: commentId },
          data: {
            score: {
              increment: scoreChange,
            },
          },
        })

        return voteResult
      })
    }),

  getPending: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.listing.findMany({
      where: { status: ListingApprovalStatus.PENDING },
      include: {
        game: { include: { system: true } },
        device: { include: { brand: true } },
        emulator: true,
        author: { select: { id: true, name: true, email: true } },
        performance: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
  }),

  approveListing: adminProcedure
    .input(ApproveListingSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId } = input
      const adminUserId = ctx.session.user.id

      // Verify admin user exists
      const adminUserExists = await ctx.prisma.user.findUnique({
        where: { id: adminUserId },
        select: { id: true },
      })
      if (!adminUserExists) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Approving user (admin) with ID ${adminUserId} not found in database.`,
        })
      }

      const listingToApprove = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
      })

      if (
        !listingToApprove ||
        listingToApprove.status !== ListingApprovalStatus.PENDING
      ) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Pending listing not found or already processed.',
        })
      }

      return ctx.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: ListingApprovalStatus.APPROVED,
          processedByUserId: adminUserId,
          processedAt: new Date(),
          processedNotes: null,
        },
      })
    }),

  rejectListing: adminProcedure
    .input(RejectListingSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, notes } = input
      const adminUserId = ctx.session.user.id

      // Verify admin user exists
      const adminUserExists = await ctx.prisma.user.findUnique({
        where: { id: adminUserId },
        select: { id: true },
      })
      if (!adminUserExists) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Rejecting user (admin) with ID ${adminUserId} not found in database.`,
        })
      }

      const listingToReject = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
      })

      if (
        !listingToReject ||
        listingToReject.status !== ListingApprovalStatus.PENDING
      ) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Pending listing not found or already processed.',
        })
      }

      return ctx.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: ListingApprovalStatus.REJECTED,
          processedByUserId: adminUserId,
          processedAt: new Date(),
          processedNotes: notes,
        },
      })
    }),

  getProcessed: superAdminProcedure
    .input(GetProcessedSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, filterStatus } = input
      const skip = (page - 1) * limit

      const whereClause: Prisma.ListingWhereInput = {
        NOT: { status: ListingApprovalStatus.PENDING }, // Exclude PENDING listings
      }

      if (filterStatus) {
        whereClause.status = filterStatus
      }

      const listings = await ctx.prisma.listing.findMany({
        where: whereClause,
        include: {
          game: { include: { system: true } },
          device: { include: { brand: true } },
          emulator: true,
          author: { select: { id: true, name: true, email: true } },
          performance: true,
          processedByUser: { select: { id: true, name: true, email: true } }, // Admin who processed
        },
        orderBy: {
          processedAt: 'desc', // Show most recently processed first
        },
        skip,
        take: limit,
      })

      const totalListings = await ctx.prisma.listing.count({
        where: whereClause,
      })

      return {
        listings,
        pagination: {
          total: totalListings,
          pages: Math.ceil(totalListings / limit),
          currentPage: page,
          limit,
        },
      }
    }),

  overrideApprovalStatus: superAdminProcedure
    .input(OverrideApprovalStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { listingId, newStatus, overrideNotes } = input
      const superAdminUserId = ctx.session.user.id

      const listingToOverride = await ctx.prisma.listing.findUnique({
        where: { id: listingId },
      })

      if (!listingToOverride) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Listing not found.',
        })
      }

      // Prevent setting to PENDING if it was never processed, or other invalid transitions if needed.
      // For now, allowing any override by SUPER_ADMIN.

      return ctx.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: newStatus,
          processedByUserId: superAdminUserId, // Log the SUPER_ADMIN as the latest processor
          processedAt: new Date(), // Update timestamp to the override time
          processedNotes: overrideNotes ?? listingToOverride.processedNotes, // Keep old notes if no new ones
        },
      })
    }),
})
