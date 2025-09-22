import { roleIncludesRole } from '@/utils/permission-system'
import { type Prisma, type PrismaClient, Role } from '@orm'

type PrismaLike = PrismaClient | Prisma.TransactionClient

interface Params {
  prisma: PrismaLike
  userRole: Role
  userId: string
  emulatorId?: string | null
}

export async function canManageCommentPins({
  prisma,
  userRole,
  userId,
  emulatorId,
}: Params): Promise<boolean> {
  if (roleIncludesRole(userRole, Role.MODERATOR)) return true

  if (userRole === Role.DEVELOPER && emulatorId) {
    const verified = await prisma.verifiedDeveloper.findFirst({
      where: { userId, emulatorId },
      select: { id: true },
    })

    return Boolean(verified)
  }

  return false
}
