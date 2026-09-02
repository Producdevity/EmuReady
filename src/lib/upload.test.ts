import { beforeEach, describe, expect, it, vi } from 'vitest'

const uploadMocks = vi.hoisted(() => ({
  deleteObject: vi.fn(),
  putUpload: vi.fn(),
  updateUser: vi.fn(),
}))

vi.mock('@/server/db', () => ({
  prisma: { user: { update: uploadMocks.updateUser } },
}))

vi.mock('@/server/services/r2.service', () => ({
  deleteObject: uploadMocks.deleteObject,
}))

vi.mock('@/server/services/uploads.service', () => ({
  putUpload: uploadMocks.putUpload,
}))

const { uploadFile } = await import('./upload')

function createImageFile(): File {
  const file = new File(['image'], 'avatar.png', { type: 'image/png' })
  Object.defineProperty(file, 'arrayBuffer', {
    value: vi.fn().mockResolvedValue(Uint8Array.from([1, 2, 3]).buffer),
  })
  return file
}

describe('uploadFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    uploadMocks.putUpload.mockResolvedValue({
      url: 'https://media.example.com/uploads/profiles/avatar.png',
      bucket: 'uploads',
      key: 'uploads/profiles/avatar.png',
    })
    uploadMocks.deleteObject.mockResolvedValue(undefined)
  })

  it('deletes a profile image when the database update fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    uploadMocks.updateUser.mockRejectedValueOnce(new Error('database unavailable'))

    const result = await uploadFile(createImageFile(), 'clerk_user_1', {
      directory: 'profiles',
      updateUserProfile: true,
    })

    expect(result).toEqual({ success: false, error: 'Failed to upload file' })
    expect(uploadMocks.deleteObject).toHaveBeenCalledWith({
      bucket: 'uploads',
      key: 'uploads/profiles/avatar.png',
    })
    consoleError.mockRestore()
  })

  it('does not delete a successfully persisted profile image', async () => {
    uploadMocks.updateUser.mockResolvedValueOnce({})

    await expect(
      uploadFile(createImageFile(), 'clerk_user_1', {
        directory: 'profiles',
        updateUserProfile: true,
      }),
    ).resolves.toEqual({
      success: true,
      imageUrl: 'https://media.example.com/uploads/profiles/avatar.png',
    })
    expect(uploadMocks.deleteObject).not.toHaveBeenCalled()
  })
})
