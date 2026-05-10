import { type PrismaClient, Role } from '@orm'
import { USER_BAN_ACTION_TARGET, USER_BAN_TABLE_FIXTURE } from '../seed-data/userModeration'

const MODERATION_TARGETS = [USER_BAN_TABLE_FIXTURE, USER_BAN_ACTION_TARGET]

async function upsertModerationTarget(prisma: PrismaClient, email: string, name: string) {
  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: Role.USER,
    },
    create: {
      clerkId: `e2e-${email}`,
      email,
      name,
      role: Role.USER,
      settings: { create: {} },
    },
  })
}

async function createInactiveBanFixture(prisma: PrismaClient, targetUserId: string) {
  const superAdmin = await prisma.user.findUnique({
    where: { email: 'superadmin@emuready.com' },
  })

  if (!superAdmin) throw new Error('Expected seeded super admin user to exist')

  await prisma.userBan.deleteMany({
    where: { userId: targetUserId },
  })

  await prisma.userBan.create({
    data: {
      userId: targetUserId,
      bannedById: superAdmin.id,
      reason: USER_BAN_TABLE_FIXTURE.reason,
      notes: 'E2E moderation table fixture',
      isActive: false,
      unbannedAt: new Date(),
      unbannedById: superAdmin.id,
    },
  })
}

async function userModerationFixturesSeeder(prisma: PrismaClient) {
  console.info('Seeding user moderation fixtures...')

  const targetUsers = await Promise.all(
    MODERATION_TARGETS.map((target) => upsertModerationTarget(prisma, target.email, target.name)),
  )

  const tableFixtureUser = targetUsers.find((user) => user.email === USER_BAN_TABLE_FIXTURE.email)

  if (!tableFixtureUser) throw new Error('Expected user ban table fixture to exist')

  await createInactiveBanFixture(prisma, tableFixtureUser.id)

  console.info('User moderation fixtures seeded')
}

export default userModerationFixturesSeeder
