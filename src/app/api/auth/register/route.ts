import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcryptjs from 'bcryptjs'
import { prisma } from '@/server/db'
import { isValidEmail, sanitizeString } from '@/utils/validation'

const UserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate request body
    const result = UserSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: result.error.flatten() },
        { status: 400 },
      )
    }

    const { name, email, password } = result.data

    // Additional manual validation as an extra security layer
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 },
      )
    }

    // Sanitize name input
    const sanitizedName = sanitizeString(name)
    if (!sanitizedName.trim()) {
      return NextResponse.json(
        { message: 'Name cannot be empty' },
        { status: 400 },
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 },
      )
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Create new user
    const user = await prisma.user.create({
      data: {
        name: sanitizedName,
        email,
        hashedPassword,
        role: 'USER', // Default role
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
