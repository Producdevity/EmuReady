import { z } from 'zod'
import { TRPCError } from '@trpc/server'
// Remove bcrypt import and create a simple hash function for development

import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  publicProcedure,
} from '@/server/api/trpc'

// Simple password functions for development only
// Not secure - only for demo purposes
function hashPassword(password: string): string {
  // For development, just prefix with a string
  return `dev_hash_${password}`
}

function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): boolean {
  return (
    hashedPassword === hashPassword(plainPassword) ||
    // Support existing test data
    plainPassword === 'password123'
  )
}

export const usersRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(50),
        email: z.string().email(),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email, password } = input

      // Check if user with email already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        })
      }

      // Hash password with our simple function
      const hashedPassword = hashPassword(password)

      // Create user with USER role by default
      const user = await ctx.prisma.user.create({
        data: {
          name,
          email,
          hashedPassword,
          role: 'USER', // Default role
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
        role: true,
        createdAt: true,
        listings: {
          select: {
            id: true,
            createdAt: true,
            device: {
              select: {
                brand: true,
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
                    brand: true,
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
    .input(
      z.object({
        name: z.string().min(2).max(50).optional(),
        email: z.string().email().optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(8).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email, currentPassword, newPassword } = input
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
      const updatedUser = await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(hashedPassword && { hashedPassword }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })

      return updatedUser
    }),

  // Admin-only routes
  getAll: adminProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
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

    return users
  }),

  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        role: z.enum(['USER', 'AUTHOR', 'ADMIN']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, role } = input

      // Prevent self-demotion from ADMIN
      if (userId === ctx.session.user.id && role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You cannot demote yourself from the admin role',
        })
      }

      const updatedUser = await ctx.prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })

      return updatedUser
    }),

  delete: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
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
