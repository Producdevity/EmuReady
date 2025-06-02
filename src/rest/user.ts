import http from './http'

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
