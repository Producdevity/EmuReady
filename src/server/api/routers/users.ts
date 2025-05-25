import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import bcryptjs from 'bcryptjs'
import {
  RegisterUserSchema,
  GetUserByIdSchema,
  UpdateUserSchema,
  UpdateUserRoleSchema,
  DeleteUserSchema,
} from '@/schemas/user'

function hashPassword(password: string): string {
  const salt = bcryptjs.genSaltSync(10)
  return bcryptjs.hashSync(password, salt)
}

function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): boolean {
  try {
    return bcryptjs.compareSync(plainPassword, hashedPassword)
  } catch (error) {
    console.error('Error comparing passwords:', error)
    return false
  }
}

export const usersRouter = createTRPCRouter({
  register: publicProcedure
    .input(RegisterUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, email, password } = input

      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        })
      }

      const hashedPassword = hashPassword(password)

      const user = await ctx.prisma.user.create({
        data: {
          name,
          email,
          hashedPassword,
          role: 'USER',
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
                brand: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                modelName: true,
              },
            },
            game: {
              select: {
                title: true,
              },
            },
            emulator: {
              select: {
                name: true,
              },
            },
            performance: {
              select: {
                label: true,
              },
            },
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
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                    modelName: true,
                  },
                },
                game: {
                  select: {
                    title: true,
                  },
                },
                emulator: {
                  select: {
                    name: true,
                  },
                },
                performance: {
                  select: {
                    label: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

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
                  brand: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  modelName: true,
                },
              },
              game: {
                select: {
                  title: true,
                },
              },
              emulator: {
                select: {
                  name: true,
                },
              },
              performance: {
                select: {
                  label: true,
                },
              },
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
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                      modelName: true,
                    },
                  },
                  game: {
                    select: {
                      title: true,
                    },
                  },
                  emulator: {
                    select: {
                      name: true,
                    },
                  },
                  performance: {
                    select: {
                      label: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      return user
    }),

  update: protectedProcedure
    .input(UpdateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, email, currentPassword, newPassword, profileImage } = input
      const userId = ctx.session.user.id

      // Get the current user
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          hashedPassword: true,
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      // If email is being changed, check if it's already in use
      if (email && email !== user.email) {
        const existingUser = await ctx.prisma.user.findUnique({
          where: { email },
        })

        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email is already in use',
          })
        }
      }

      // If passwords are provided, verify and update
      let hashedPassword = undefined
      if (currentPassword && newPassword) {
        const isPasswordValid = comparePassword(
          currentPassword,
          user.hashedPassword!,
        )

        if (!isPasswordValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Current password is incorrect',
          })
        }

        hashedPassword = hashPassword(newPassword)
      }

      // Update user
      return await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(hashedPassword && { hashedPassword }),
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
  getAll: adminProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.user.findMany({
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
    })
  }),

  updateRole: adminProcedure
    .input(UpdateUserRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, role } = input

      // Prevent self-demotion from ADMIN
      if (userId === ctx.session.user.id && role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You cannot demote yourself from the admin role',
        })
      }

      return await ctx.prisma.user.update({
        where: { id: userId },
        data: { role },
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
      if (userId === ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You cannot delete your own account',
        })
      }

      await ctx.prisma.user.delete({
        where: { id: userId },
      })

      return { success: true }
    }),
})
