import { Role } from '@orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcryptjs from 'bcryptjs'
import { prisma } from '@/server/db'
import { isValidEmail, sanitizeString } from '@/utils/validation'

// TODO: look into Zod generator https://www.prisma.io/docs/orm/prisma-schema/overview/generators
const UserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const result = UserSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: result.error.flatten() },
        { status: 400 },
      )
    }

    const { name, email, password } = result.data

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 },
      )
    }

    const sanitizedName = sanitizeString(name)
    if (!sanitizedName.trim()) {
      return NextResponse.json(
        { message: 'Name cannot be empty' },
        { status: 400 },
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 },
      )
    }

    const hashedPassword = await bcryptjs.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name: sanitizedName,
        email,
        hashedPassword,
        role: Role.USER, // Default role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'An error occurred during registration' },
      { status: 500 },
    )
  }
}
