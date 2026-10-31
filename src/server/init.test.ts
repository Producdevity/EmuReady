import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  notification: vi.fn(),
  switchGame: vi.fn<() => Promise<void>>(),
  threeDsGame: vi.fn<() => Promise<void>>(),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({ logger: mocks.logger }))
vi.mock('./notifications/init', () => ({ initializeNotificationService: mocks.notification }))
vi.mock('./utils/switchGameInit', () => ({ initializeSwitchGameService: mocks.switchGame }))
vi.mock('./utils/threeDsGameInit', () => ({ initializeThreeDsGameService: mocks.threeDsGame }))

beforeEach(() => {
  vi.resetModules()
  vi.resetAllMocks()
  Reflect.deleteProperty(globalThis, 'initializationPromise')
  Reflect.deleteProperty(globalThis, 'serviceStatus')
})

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'initializationPromise')
  Reflect.deleteProperty(globalThis, 'serviceStatus')
})

describe('server startup', () => {
  it('registers notification listeners once without waiting for stalled catalog downloads', async () => {
    mocks.switchGame.mockReturnValue(new Promise<void>(() => {}))
    mocks.threeDsGame.mockReturnValue(new Promise<void>(() => {}))
    const server = await import('./init')

    await server.initializeServerOnce()
    await server.initializeServerOnce()

    expect(mocks.notification).toHaveBeenCalledTimes(1)
    expect(mocks.switchGame).toHaveBeenCalledTimes(1)
    expect(mocks.threeDsGame).toHaveBeenCalledTimes(1)
    expect(server.getServiceStatus()).toMatchObject({
      notification: { initialized: true },
      switchGame: { initialized: false },
      threeDsGame: { initialized: false },
    })
  })

  it('records catalog startup failures without rejecting server startup', async () => {
    const upstreamError = new Error('Catalog unavailable')
    mocks.switchGame.mockRejectedValue(upstreamError)
    mocks.threeDsGame.mockResolvedValue()
    const server = await import('./init')

    await server.initializeServerOnce()

    await vi.waitFor(() => {
      expect(mocks.logger.warn).toHaveBeenCalledWith(
        '⚠️ Some services failed to initialize. They will be retried on next access.',
      )
    })
    expect(mocks.notification).toHaveBeenCalledTimes(1)
    expect(mocks.logger.error).toHaveBeenCalledWith(expect.any(String), upstreamError)
    expect(server.getServiceStatus()).toMatchObject({
      switchGame: { initialized: false, failureCount: 1 },
      threeDsGame: { initialized: true },
    })
  })
})
