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
    throw new Error(res.data?.error ?? 'Image upload failed')
  }
  
  // Extract imageUrl from the response object
  if (!res.data?.imageUrl) {
    throw new Error('Invalid response: missing imageUrl')
  }
  
  return res.data.imageUrl
}
