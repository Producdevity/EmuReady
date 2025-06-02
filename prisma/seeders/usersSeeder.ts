import { type PrismaClient, Role } from '@orm'
import { clerkClient } from '@clerk/nextjs/server'

type UserData = {
  email: string
  name: string
  role: Role
  firstName: string
  lastName: string
}

// These users will be created in both Clerk and database for development testing
const users: UserData[] = [
  {
    email: 'superadmin@emuready.com',
    name: 'Super Admin User',
    firstName: 'Super Admin',
    lastName: 'User',
    role: Role.SUPER_ADMIN,
  },
  {
    email: 'admin@emuready.com',
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    role: Role.ADMIN,
  },
  {
    email: 'author@emuready.com',
    name: 'Author User',
    firstName: 'Author',
    lastName: 'User',
    role: Role.AUTHOR,
  },
  {
    email: 'user@emuready.com',
    name: 'Regular User',
    firstName: 'Regular',
    lastName: 'User',
    role: Role.USER,
  },
]

const DEFAULT_SEED_PASSWORD = 'DevPassword123!'

async function cleanupExistingUsers(prisma: PrismaClient) {
  console.log('🧹 Cleaning up existing seed users...')
  
  const clerk = await clerkClient()
  
  for (const userData of users) {
    try {
      // Find and delete from Clerk
      const existingClerkUsers = await clerk.users.getUserList({
        emailAddress: [userData.email],
      })
      
      if (existingClerkUsers.totalCount > 0) {
        const clerkUser = existingClerkUsers.data[0]
        await clerk.users.deleteUser(clerkUser.id)
        console.log(`🗑️  Deleted Clerk user: ${userData.email}`)
      }
      
      // Delete from database
      await prisma.user.deleteMany({
        where: { email: userData.email },
      })
      console.log(`🗑️  Deleted database user: ${userData.email}`)
    } catch {
      console.log(`⚠️  Could not delete ${userData.email}: user may not exist`)
    }
  }
  
  console.log('✅ Cleanup completed')
}

async function usersSeeder(prisma: PrismaClient, shouldCleanup = false) {
  if (shouldCleanup) {
    await cleanupExistingUsers(prisma)
  }
  
  console.log('🌱 Seeding users...')
  console.log('📝 Creating users in both Clerk and database for development.')
  console.log(`🔑 Default password for all seed users: ${DEFAULT_SEED_PASSWORD}`)

  const clerk = await clerkClient()

  for (const userData of users) {
    try {
      // Check if user already exists in database
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      })

      if (existingUser) {
        console.log(`✓ User ${userData.email} already exists in database`)
        continue
      }

      // Create user in Clerk first
      console.log(`Creating Clerk user: ${userData.email}`)
      const clerkUser = await clerk.users.createUser({
        emailAddress: [userData.email],
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: DEFAULT_SEED_PASSWORD,
        skipPasswordChecks: true, // For development only
        publicMetadata: {
          role: userData.role,
        },
      })

      // Then create user in database with the Clerk ID
      await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          profileImage: clerkUser.imageUrl || null,
        },
      })

      console.log(`✅ Created user: ${userData.email} (clerkId: ${clerkUser.id})`)
    } catch (error: unknown) {
      const clerkError = error as {
        errors?: Array<{ code: string }>
      }
      
      if (clerkError?.errors?.[0]?.code === 'form_identifier_exists') {
        console.log(`⚠️  User ${userData.email} already exists in Clerk`)
        
        // Try to find the Clerk user and create database record
        try {
          const existingClerkUsers = await clerk.users.getUserList({
            emailAddress: [userData.email],
          })
          
          if (existingClerkUsers.totalCount > 0) {
            const clerkUser = existingClerkUsers.data[0]
            
            // Update their metadata to ensure role is set
            await clerk.users.updateUserMetadata(clerkUser.id, {
              publicMetadata: { role: userData.role },
            })
            
            // Create database record if it doesn't exist
            await prisma.user.upsert({
              where: { email: userData.email },
              update: {},
              create: {
                clerkId: clerkUser.id,
                email: userData.email,
                name: userData.name,
                role: userData.role,
                profileImage: clerkUser.imageUrl || null,
              },
            })
            
            console.log(`✅ Synced existing user: ${userData.email}`)
          }
        } catch (syncError) {
          console.error(`❌ Failed to sync existing user ${userData.email}:`, syncError)
        }
      } else {
        console.error(`❌ Failed to create user ${userData.email}:`, error)
      }
    }
  }

  console.log('✅ Users seeding completed')
  console.log('📝 You can now log in with any of these accounts using the default password.')
  console.log('⚠️  Note: Make sure your webhooks are configured for production environments.')
  console.log('   See DEVELOPMENT_SETUP.md for webhook configuration instructions.')
}

export default usersSeeder
