import {
  PrismaRepository,
  type PrismaRepositoryClient,
} from '@/server/persistence/prisma.repository'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'
import { Role, type Prisma } from '@orm/client'

const sessionUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  settings: { select: { showNsfw: true } },
} satisfies Prisma.UserSelect

type ClerkUserInput = Pick<Prisma.UserCreateInput, 'clerkId' | 'email' | 'name' | 'profileImage'>

export class SessionUsersRepository extends PrismaRepository {
  constructor(prisma: PrismaRepositoryClient) {
    super(prisma)
  }

  findByClerkId(clerkId: string) {
    return this.prisma.user.findUnique({
      where: { clerkId },
      select: sessionUserSelect,
    })
  }

  async createForClerkUser(data: ClerkUserInput) {
    try {
      return await this.prisma.user.create({
        data: { ...data, role: Role.USER, settings: { create: {} } },
        select: sessionUserSelect,
      })
    } catch (error) {
      if (isPrismaError(error, PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION)) {
        // Webhook delivery and authenticated requests can create the same user concurrently.
        const user = await this.findByClerkId(data.clerkId)
        if (user) return user
      }

      throw error
    }
  }
}
