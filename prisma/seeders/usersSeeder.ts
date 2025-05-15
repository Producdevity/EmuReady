import { type PrismaClient } from '../generated/client'
import * as bcrypt from 'bcryptjs'

type UserData = {
  email: string
  hashedPassword: string
  name: string
  role: 'USER' | 'AUTHOR' | 'ADMIN' | 'SUPER_ADMIN'
}

const users: UserData[] = [
  {
    email: 'superadmin@emuready.com',
    hashedPassword: bcrypt.hashSync('password', 10),
    name: 'Super Admin User',
    role: 'SUPER_ADMIN',
  },
  {
    email: 'admin@emuready.com',
    hashedPassword: bcrypt.hashSync('password', 10),
    name: 'Admin User',
    role: 'ADMIN',
  },
  {
    email: 'author@emuready.com',
    hashedPassword: bcrypt.hashSync('password', 10),
    name: 'Author User',
    role: 'AUTHOR',
  },
  {
    email: 'user@emuready.com',
    hashedPassword: bcrypt.hashSync('password', 10),
    name: 'Regular User',
    role: 'USER',
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
