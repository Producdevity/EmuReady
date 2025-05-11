import { z } from 'zod'
import http from './http'

const User = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
})

export async function registerUser(userData: z.infer<typeof User>) {
  const user = User.parse(userData)

  const res = await http.post('/auth/register', {
    name: user.name,
    email: user.email,
    password: user.password,
  })
  if (res.status !== 200) {
    throw new Error(res.data.message || 'Registration failed')
  }
  return res.data
}
