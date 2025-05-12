import { PrismaClient, Role } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

const users = [
  {
    email: 'superadmin@emuready.com',
    hashedPassword: bcryptjs.hashSync('password', 10),
    name: 'Super Admin User',
    role: Role.SUPER_ADMIN,
  },
  {
    email: 'admin@emuready.com',
    hashedPassword: bcryptjs.hashSync('password', 10),
    name: 'Admin User',
    role: Role.ADMIN,
  },
  {
    email: 'author@emuready.com',
    hashedPassword: bcryptjs.hashSync('password', 10),
    name: 'Author User',
    role: Role.AUTHOR,
  },
  {
    email: 'user1@emuready.com',
    hashedPassword: bcryptjs.hashSync('password', 10),
    name: 'Regular User 1',
    role: Role.USER,
  },
  {
    email: 'user2@emuready.com',
    hashedPassword: bcryptjs.hashSync('password', 10),
    name: 'Regular User 2',
    role: Role.USER,
  },
  {
    email: 'user3@emuready.com',
    hashedPassword: bcryptjs.hashSync('password', 10),
    name: 'Regular User 3',
    role: Role.USER,
  },
]

for (const user of users) {
  await prisma.user.upsert({
    where: { email: user.email },
    update: {},
    create: user,
  })
}
