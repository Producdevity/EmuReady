import { type PrismaClient, Role } from '@orm'
import * as bcrypt                 from 'bcryptjs'

type UserData = {
  email: string
  hashedPassword: string
  name: string
  role: Role
}

const users: UserData[] = [
  {
    email: 'superadmin@emuready.com',
    hashedPassword: bcrypt.hashSync('password', 10),
    name: 'Super Admin User',
    role: Role.SUPER_ADMIN,
  },
  {
    email: 'admin@emuready.com',
    hashedPassword: bcrypt.hashSync('password', 10),
    name: 'Admin User',
    role: Role.ADMIN,
  },
  {
    email: 'author@emuready.com',
    hashedPassword: bcrypt.hashSync('password', 10),
    name: 'Author User',
    role: Role.AUTHOR,
  },
  {
    email: 'user@emuready.com',
    hashedPassword: bcrypt.hashSync('password', 10),
    name: 'Regular User',
    role: Role.USER,
  },
]

async function usersSeeder(prisma: PrismaClient) {
  console.log('🌱 Seeding users...')

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    })
  }

  console.log('✅ Users seeded successfully')
}

export default usersSeeder
