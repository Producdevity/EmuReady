import { RestApiError } from '@/server/lib/rest/errors'
import { type PrismaClient, Role } from '@orm'

export class UserService {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        role: true,
        showNsfw: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            comments: true,
            votes: true,
          },
        },
      },
    })

    if (!user) {
      throw new RestApiError(404, 'NOT_FOUND', 'User not found')
    }

    return user
  }

  async update(
    id: string,
    currentUserId: string,
    data: {
      name?: string
      showNsfw?: boolean
      profileImage?: string
    },
  ) {
    // Check if user is updating their own profile
    if (id !== currentUserId) {
      // Check if current user is admin
      const currentUser = await this.prisma.user.findUnique({
        where: { id: currentUserId },
        select: { role: true },
      })

      const adminRoles: Role[] = [Role.ADMIN, Role.SUPER_ADMIN]
      if (!currentUser || !adminRoles.includes(currentUser.role)) {
        throw new RestApiError(
          403,
          'FORBIDDEN',
          'You can only update your own profile',
        )
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        profileImage: true,
        role: true,
        showNsfw: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            comments: true,
            votes: true,
          },
        },
      },
    })

    return updatedUser
  }
}
