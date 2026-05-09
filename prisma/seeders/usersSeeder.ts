import { clerkClient } from '@clerk/nextjs/server'
import { type User as ClerkUser } from '@clerk/nextjs/server'
import { type PrismaClient, Role } from '@orm'

type UserData = {
  email: string
  name: string
  role: Role
  firstName: string
  lastName: string
  username: string
}

const users: UserData[] = [
  {
    email: 'superadmin@emuready.com',
    name: 'Super Admin User',
    firstName: 'Super Admin',
    lastName: 'User',
    username: 'superadmin',
    role: Role.SUPER_ADMIN,
  },
  {
    email: 'admin@emuready.com',
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    username: 'admin',
    role: Role.ADMIN,
  },
  {
    email: 'moderator@emuready.com',
    name: 'Moderator User',
    firstName: 'Moderator',
    lastName: 'User',
    username: 'moderator',
    role: Role.MODERATOR,
  },
  {
    email: 'developer@emuready.com',
    name: 'Developer User',
    firstName: 'Developer',
    lastName: 'User',
    username: 'developer',
    role: Role.DEVELOPER,
  },
  {
    email: 'author@emuready.com',
    name: 'Author User',
    firstName: 'Author',
    lastName: 'User',
    username: 'author',
    role: Role.AUTHOR,
  },
  {
    email: 'user@emuready.com',
    name: 'Regular User',
    firstName: 'Regular',
    lastName: 'User',
    username: 'user',
    role: Role.USER,
  },
]

const DEFAULT_SEED_PASSWORD = 'DevPassword123!'

async function cleanupExistingUsers(prisma: PrismaClient) {
  console.info('🧹 Cleaning up existing seed users...')

  const clerk = await clerkClient()

  for (const userData of users) {
    try {
      const existingClerkUsers = await clerk.users.getUserList({
        emailAddress: [userData.email],
      })

      if (existingClerkUsers.totalCount > 0) {
        const clerkUser = existingClerkUsers.data[0]
        await clerk.users.deleteUser(clerkUser.id)
        console.info(`🗑️  Deleted Clerk user: ${userData.email}`)
      }

      await prisma.user.deleteMany({ where: { email: userData.email } })
      console.info(`🗑️  Deleted database user: ${userData.email}`)
    } catch {
      console.info(`⚠️  Could not delete ${userData.email}: user may not exist`)
    }
  }

  console.info('✅ Cleanup completed')
}

async function usersSeeder(prisma: PrismaClient, shouldCleanup = false) {
  if (shouldCleanup) {
    await cleanupExistingUsers(prisma)
  }

  console.info('🌱 Seeding users...')
  console.info('📝 Reconciling Clerk + database state for seed users.')
  console.info('🔑 Seed users were synchronized with the configured default password.')

  const clerk = await clerkClient()
  const failedUsers: string[] = []
  for (const userData of users) {
    try {
      const existingClerkUsers = await clerk.users.getUserList({
        emailAddress: [userData.email],
      })

      let clerkUser: ClerkUser
      let action: 'created' | 'reconciled'

      if (existingClerkUsers.totalCount === 0) {
        console.info(`Creating Clerk user: ${userData.email}`)
        clerkUser = await clerk.users.createUser({
          emailAddress: [userData.email],
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          password: DEFAULT_SEED_PASSWORD,
          skipPasswordChecks: true,
          publicMetadata: { role: userData.role },
        })
        action = 'created'
      } else {
        clerkUser = existingClerkUsers.data[0]
        clerkUser = await clerk.users.updateUser(clerkUser.id, {
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          password: DEFAULT_SEED_PASSWORD,
          skipPasswordChecks: true,
          publicMetadata: { role: userData.role },
        })
        action = 'reconciled'
      }

      await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          clerkId: clerkUser.id,
          name: userData.name,
          role: userData.role,
          profileImage: clerkUser.imageUrl || null,
        },
        create: {
          clerkId: clerkUser.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          profileImage: clerkUser.imageUrl || null,
          settings: { create: {} },
        },
      })

      console.info(`✅ ${action} user: ${userData.email} (clerkId: ${clerkUser.id})`)
    } catch (error) {
      failedUsers.push(userData.email)
      console.error(`❌ Failed to seed user ${userData.email}:`, error)
    }
  }

  if (failedUsers.length > 0) {
    throw new Error(`Failed to seed users: ${failedUsers.join(', ')}`)
  }

  console.info('✅ Users seeding completed')
  console.info('📝 You can now log in with any of these accounts using the default password.')
  console.warn('⚠️  Note: Make sure your webhooks are configured for production environments.')
  console.info('   See DEVELOPMENT_SETUP.md for webhook configuration instructions.')
}

export default usersSeeder
