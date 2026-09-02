import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const uploadMocks = vi.hoisted(() => ({
  deleteObject: vi.fn(),
  findUser: vi.fn(),
  putUpload: vi.fn(),
  updateUser: vi.fn(),
}))

vi.mock('@/server/db', () => ({
  prisma: { user: { findUnique: uploadMocks.findUser, update: uploadMocks.updateUser } },
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
    uploadMocks.findUser.mockResolvedValue({ profileImage: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deletes a profile image when the database update fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    uploadMocks.updateUser.mockRejectedValueOnce(new Error('database unavailable'))

    const result = await uploadFile(createImageFile(), 'clerk_user_1', {
      directory: 'profiles',
      updateUserProfile: true,
    })

    expect(result).toEqual({ success: false, error: 'Failed to upload file' })
    expect(uploadMocks.findUser).toHaveBeenCalledWith({
      where: { clerkId: 'clerk_user_1' },
      select: { profileImage: true },
    })
    expect(uploadMocks.deleteObject).toHaveBeenCalledWith({
      bucket: 'uploads',
      key: 'uploads/profiles/avatar.png',
    })
    expect(consoleError).toHaveBeenCalled()
  })

  it('keeps a profile image when the failed update response was committed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    uploadMocks.updateUser.mockRejectedValueOnce(new Error('connection lost after commit'))
    uploadMocks.findUser.mockResolvedValueOnce({
      profileImage: 'https://media.example.com/uploads/profiles/avatar.png',
    })

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

  it('does not delete the upload when persistence cannot be verified', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    uploadMocks.updateUser.mockRejectedValueOnce(new Error('database unavailable'))
    uploadMocks.findUser.mockRejectedValueOnce(new Error('database unavailable'))

    await expect(
      uploadFile(createImageFile(), 'clerk_user_1', {
        directory: 'profiles',
        updateUserProfile: true,
      }),
    ).resolves.toEqual({ success: false, error: 'Failed to upload file' })
    expect(uploadMocks.deleteObject).not.toHaveBeenCalled()
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
