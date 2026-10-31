import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ms } from '@/utils/time'

const mocks = vi.hoisted(() => ({
  notification: vi.fn(),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), log: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({ logger: mocks.logger }))
vi.mock('./notifications/init', () => ({ initializeNotificationService: mocks.notification }))

beforeEach(() => {
  vi.resetModules()
  vi.resetAllMocks()
  vi.useFakeTimers()
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('CI', '')
  vi.stubEnv('PWTEST_SKIP_WEBSERVER', '')
  vi.stubEnv('PLAYWRIGHT_TEST', '')
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  Reflect.deleteProperty(globalThis, 'initializationPromise')
  Reflect.deleteProperty(globalThis, 'serviceStatus')
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  Reflect.deleteProperty(globalThis, 'initializationPromise')
  Reflect.deleteProperty(globalThis, 'serviceStatus')
})

describe('real catalog startup', () => {
  it('keeps refresh services scheduled after a provider outage and recovers on the timer', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new Error('Provider unavailable'))
    vi.stubGlobal('fetch', fetchMock)
    const server = await import('./init')

    await server.initializeServerOnce()
    await vi.waitFor(() => {
      expect(server.getServiceStatus()).toMatchObject({
        notification: { initialized: true },
        switchGame: { initialized: true },
        threeDsGame: { initialized: true },
      })
    })
    expect(fetchMock).toHaveBeenCalled()
    expect(mocks.notification).toHaveBeenCalledTimes(1)

    fetchMock.mockImplementation(async (input) => {
      const url = String(input)
      const titleId = '00040000001A5F00'
      if (url.endsWith('switchbrew_id_names.json')) {
        return Response.json([
          {
            program_id: '01006A800016E000',
            name: 'Test Adventure',
            title_normalized: 'test adventure',
          },
        ])
      }
      if (url.endsWith('/titles.json')) {
        return Response.json({ [titleId]: { title_id: titleId, platform_device: 'CTR' } })
      }
      return Response.json({ [titleId]: { US: 'Test Adventure' } })
    })
    await vi.advanceTimersByTimeAsync(ms.hours(24))

    const switchCatalog = await import('./utils/switchGameSearch')
    const threeDsCatalog = await import('./utils/threeDsGameSearch')
    expect(await switchCatalog.getSwitchGamesStats()).toMatchObject({
      totalGames: 1,
      cacheStatus: 'hit',
    })
    expect(await threeDsCatalog.getThreeDsGamesStats()).toMatchObject({
      totalGames: 1,
      cacheStatus: 'hit',
    })
  })
})
