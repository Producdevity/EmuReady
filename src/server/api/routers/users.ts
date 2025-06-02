import type { Prisma } from '@orm'
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc'
import { hasPermission } from '@/utils/permissions'
import { Role }                    from '@orm'
import { AppError, ResourceError } from '@/lib/errors'
import { updateUserRole }          from '@/utils/roleSync'
import {
  RegisterUserSchema,
  GetUserByIdSchema,
  GetAllUsersSchema,
  UpdateUserSchema,
  UpdateUserRoleSchema,
  DeleteUserSchema,
} from '@/schemas/user'

export const usersRouter = createTRPCRouter({

  me: protectedProcedure.query(({ ctx }) => {
    if (!ctx.session?.user) return AppError.notAuthenticated()

    return {
      id: ctx.session.user.id,
      email: ctx.session.user.email,
      name: ctx.session.user.name,
      role: ctx.session.user.role,
    }
  }),

  register: publicProcedure
    .input(RegisterUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, email } = input

      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) ResourceError.user.emailExists()

      // Note: This endpoint is deprecated since Clerk handles user registration
      // This is kept for backward compatibility but should not be used in production
      const user = await ctx.prisma.user.create({
        data: {
          clerkId: `legacy_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          name,
          email,
          role: Role.USER,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      })

      return {
        status: 'success',
        data: user,
      }
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        role: true,
        createdAt: true,
        listings: {
          select: {
            id: true,
            createdAt: true,
            device: {
              select: {
                brand: { select: { id: true, name: true } },
                modelName: true,
              },
            },
            game: { select: { title: true } },
            emulator: { select: { name: true } },
            performance: { select: { label: true } },
          },
        },
        votes: {
          select: {
            id: true,
            value: true,
            listing: {
              select: {
                id: true,
                device: {
                  select: {
                    brand: {
                      select: { id: true, name: true },
                    },
                    modelName: true,
                  },
                },
                game: { select: { title: true } },
                emulator: { select: { name: true } },
                performance: { select: { label: true } },
              },
            },
          },
        },
      },
    })

    if (!user) ResourceError.user.notFound()

    return user
  }),

  getUserById: publicProcedure
    .input(GetUserByIdSchema)
    .query(async ({ ctx, input }) => {
      const { userId } = input

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          profileImage: true,
          role: true,
          createdAt: true,
          listings: {
            select: {
              id: true,
              createdAt: true,
              device: {
                select: {
                  brand: { select: { id: true, name: true } },
                  modelName: true,
                },
              },
              game: { select: { title: true } },
              emulator: { select: { name: true } },
              performance: { select: { label: true } },
            },
          },
          votes: {
            select: {
              id: true,
              value: true,
              listing: {
                select: {
                  id: true,
                  device: {
                    select: {
                      brand: { select: { id: true, name: true } },
                      modelName: true,
                    },
                  },
                  game: { select: { title: true } },
                  emulator: { select: { name: true } },
                  performance: { select: { label: true } },
                },
              },
            },
          },
        },
      })

      if (!user) ResourceError.user.notFound()

      return user
    }),

  update: protectedProcedure
    .input(UpdateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, email, profileImage } = input
      const userId = ctx.session.user.id

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
        },
      })

      if (!user) return ResourceError.user.notFound()

      if (email && email !== user.email) {
        const existingUser = await ctx.prisma.user.findUnique({
          where: { email },
        })

        if (existingUser) ResourceError.user.emailExists()
      }

      // Update user (note: password changes handled by Clerk)
      return await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(profileImage && { profileImage }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          role: true,
        },
      })
    }),

  // Admin-only routes
  getAll: adminProcedure
    .input(GetAllUsersSchema)
    .query(async ({ ctx, input }) => {
      const { search, sortField, sortDirection } = input ?? {}

      // Build where clause for search
      let where: Prisma.UserWhereInput = {}

      if (search && search.trim() !== '') {
        const searchTerm = search.trim()
        where = {
          OR: [
            {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          ],
        }
      }

      // Build orderBy based on sortField and sortDirection
      const orderBy: Prisma.UserOrderByWithRelationInput[] = []

      if (sortField && sortDirection) {
        switch (sortField) {
          case 'name':
            orderBy.push({ name: sortDirection })
            break
          case 'email':
            orderBy.push({ email: sortDirection })
            break
          case 'role':
            orderBy.push({ role: sortDirection })
            break
          case 'createdAt':
            orderBy.push({ createdAt: sortDirection })
            break
          case 'listingsCount':
            orderBy.push({ listings: { _count: sortDirection } })
            break
          case 'votesCount':
            orderBy.push({ votes: { _count: sortDirection } })
            break
          case 'commentsCount':
            orderBy.push({ comments: { _count: sortDirection } })
            break
        }
      }

      // Default ordering if no sort specified
      if (!orderBy.length) {
        orderBy.push({ createdAt: 'desc' })
      }

      return await ctx.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              listings: true,
              votes: true,
              comments: true,
            },
          },
        },
        orderBy,
      })
    }),

  updateRole: adminProcedure
    .input(UpdateUserRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, role } = input

      // Prevent self-demotion from ADMIN
      if (
        userId === ctx.session.user.id &&
        !hasPermission(ctx.session.user.role, Role.ADMIN)
      ) {
        ResourceError.user.cannotDemoteSelf()
      }

      // Use the role sync utility to update both database and Clerk
      await updateUserRole(userId, role)

      // Return updated user data
      return await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })
    }),

  delete: adminProcedure
    .input(DeleteUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = input

      // Prevent self-deletion
      if (userId === ctx.session.user.id) ResourceError.user.cannotDeleteSelf()

      await ctx.prisma.user.delete({ where: { id: userId } })

      return { success: true }
    }),
})
