import { beforeEach, describe, expect, it, vi } from 'vitest'
import { putUpload } from './uploads.service'
const r2Mocks = vi.hoisted(() => ({
  send: vi.fn(),
}))

vi.mock('@/server/services/r2.service', () => ({
  r2Client: () => ({ send: r2Mocks.send }),
}))

describe('putUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv('R2_BUCKET', 'uploads-test')
    vi.stubEnv('R2_PUBLIC_BASE_URL', 'https://media.example.com/')
  })

  it('validates the public base URL before writing an object', async () => {
    vi.stubEnv('R2_PUBLIC_BASE_URL', '')

    await expect(
      putUpload({
        directory: 'games',
        body: Buffer.from('image'),
        contentType: 'image/png',
        ext: 'png',
      }),
    ).rejects.toThrow('R2_UPLOADS_PUBLIC_BASE_URL (or R2_PUBLIC_BASE_URL) is required')
    expect(r2Mocks.send).not.toHaveBeenCalled()
  })

  it.each(['not-a-url', 'http://media.example.com', 'https://user:pass@media.example.com'])(
    'rejects an unsafe public base URL: %s',
    async (publicBaseUrl) => {
      vi.stubEnv('R2_PUBLIC_BASE_URL', publicBaseUrl)

      await expect(
        putUpload({
          directory: 'games',
          body: Buffer.from('image'),
          contentType: 'image/png',
          ext: 'png',
        }),
      ).rejects.toThrow('R2 uploads public base URL must be a valid HTTPS URL')
      expect(r2Mocks.send).not.toHaveBeenCalled()
    },
  )

  it.each([
    ['R2_UPLOADS_BUCKET', 'dedicated-uploads'],
    ['R2_UPLOADS_PUBLIC_BASE_URL', 'https://uploads.example.com'],
  ])('rejects a partial uploads override when only %s is set', async (name, value) => {
    vi.stubEnv(name, value)

    await expect(
      putUpload({
        directory: 'games',
        body: Buffer.from('image'),
        contentType: 'image/png',
        ext: 'png',
      }),
    ).rejects.toThrow('R2_UPLOADS_BUCKET and R2_UPLOADS_PUBLIC_BASE_URL must be set together')
    expect(r2Mocks.send).not.toHaveBeenCalled()
  })

  it('uses the dedicated uploads bucket and public base when both are set', async () => {
    vi.stubEnv('R2_UPLOADS_BUCKET', 'dedicated-uploads')
    vi.stubEnv('R2_UPLOADS_PUBLIC_BASE_URL', 'https://uploads.example.com')
    r2Mocks.send.mockResolvedValueOnce({})

    const result = await putUpload({
      directory: 'profiles',
      body: Buffer.from('image'),
      contentType: 'image/webp',
      ext: 'webp',
    })

    expect(result.bucket).toBe('dedicated-uploads')
    expect(result.url).toBe(`https://uploads.example.com/${result.key}`)
  })

  it('writes the object and returns its public URL', async () => {
    r2Mocks.send.mockResolvedValueOnce({})

    const result = await putUpload({
      directory: 'games',
      body: Buffer.from('image'),
      contentType: 'image/png',
      ext: 'png',
    })

    expect(r2Mocks.send).toHaveBeenCalledOnce()
    expect(result.bucket).toBe('uploads-test')
    expect(result.key).toMatch(/^uploads\/games\/[0-9a-f-]+\.png$/)
    expect(result.url).toBe(`https://media.example.com/${result.key}`)
  })
})
