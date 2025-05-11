import http from './http'

async function registerUser(userData: {
  name: string
  email: string
  password: string
}) {
  const res = await http.post('/auth/register', {
    name: userData.name,
    email: userData.email,
    password: userData.password,
  })
  if (res.status !== 200) {
    throw new Error(res.data.message || 'Registration failed')
  }
  return res.data
}

export default registerUser
