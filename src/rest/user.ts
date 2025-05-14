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
    throw new Error(res.data.message ?? 'Registration failed')
  }
  return res.data
}

export async function uploadProfileImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await http.post('/upload/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  if (res.status !== 200) {
    throw new Error(res.data.message ?? 'Image upload failed')
  }
  return res.data
}
