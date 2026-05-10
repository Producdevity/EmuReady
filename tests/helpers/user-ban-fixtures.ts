import { PrismaClient } from '@orm'
import { USER_BAN_ACTION_TARGET } from '../../prisma/seed-data/userModeration'

async function withPrisma<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  const prisma = new PrismaClient()

  try {
    return await fn(prisma)
  } finally {
    await prisma.$disconnect()
  }
}

export async function resetUserBanActionTarget() {
  await withPrisma(async (prisma) => {
    const targetUser = await prisma.user.findUnique({
      where: { email: USER_BAN_ACTION_TARGET.email },
    })

    if (!targetUser) throw new Error('Expected seeded user ban action target to exist')

    await prisma.userBan.deleteMany({
      where: { userId: targetUser.id },
    })
  })
}
