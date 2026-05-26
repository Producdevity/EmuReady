import { afterEach, describe, expect, it, vi } from 'vitest'
import { shouldRegisterServiceWorker, syncServiceWorker } from './ServiceWorkerRegistrar'

const originalServiceWorker = Object.getOwnPropertyDescriptor(window.navigator, 'serviceWorker')
const originalCaches = Object.getOwnPropertyDescriptor(window, 'caches')

function restoreProperty<T extends object>(
  target: T,
  key: keyof T,
  descriptor?: PropertyDescriptor,
) {
  if (descriptor) {
    Object.defineProperty(target, key, descriptor)
    return
  }

  Reflect.deleteProperty(target, key)
}

function mockBrowserApis(
  registrations: ServiceWorkerRegistration[] = [],
  cacheNames: string[] = [],
) {
  const register = vi.fn().mockResolvedValue({ scope: '/' })
  const getRegistrations = vi.fn().mockResolvedValue(registrations)
  const deleteCache = vi.fn().mockResolvedValue(true)

  Object.defineProperty(window.navigator, 'serviceWorker', {
    configurable: true,
    value: { register, getRegistrations },
  })

  Object.defineProperty(window, 'caches', {
    configurable: true,
    value: {
      keys: vi.fn().mockResolvedValue(cacheNames),
      delete: deleteCache,
    },
  })

  return { deleteCache, getRegistrations, register }
}

function mockRegistration(scriptURL: string) {
  const unregister = vi.fn().mockResolvedValue(true)

  return {
    registration: {
      active: { scriptURL },
      unregister,
    } as unknown as ServiceWorkerRegistration,
    unregister,
  }
}

afterEach(() => {
  restoreProperty(window.navigator, 'serviceWorker', originalServiceWorker)
  restoreProperty(window, 'caches', originalCaches)
  vi.restoreAllMocks()
})

describe('shouldRegisterServiceWorker', () => {
  it('requires the feature flag', () => {
    expect(
      shouldRegisterServiceWorker(false, {
        hostname: 'www.emuready.com',
        protocol: 'https:',
      }),
    ).toBe(false)
  })

  it.each([
    ['localhost', 'http:'],
    ['127.0.0.1', 'http:'],
    ['::1', 'http:'],
    ['dev.emuready.com', 'https:'],
    ['app.local', 'https:'],
  ])('does not register on development host %s', (hostname, protocol) => {
    expect(shouldRegisterServiceWorker(true, { hostname, protocol })).toBe(false)
  })

  it('registers on production HTTPS hosts', () => {
    expect(
      shouldRegisterServiceWorker(true, {
        hostname: 'www.emuready.com',
        protocol: 'https:',
      }),
    ).toBe(true)
  })
})

describe('syncServiceWorker', () => {
  it('registers the root service worker without clearing caches when enabled', async () => {
    const currentScriptUrl = new URL('/sw.js', window.location.href).href
    const stale = mockRegistration('https://www.emuready.com/old-worker.js')
    const current = mockRegistration(currentScriptUrl)

    const { deleteCache, register } = mockBrowserApis(
      [stale.registration, current.registration],
      ['emuready_v0.0.0', 'emuready_v0.13.2', 'third-party-cache'],
    )

    await syncServiceWorker(true, {
      hostname: 'www.emuready.com',
      protocol: 'https:',
    })

    expect(deleteCache).not.toHaveBeenCalled()
    expect(stale.unregister).toHaveBeenCalledTimes(1)
    expect(current.unregister).not.toHaveBeenCalled()
    expect(register).toHaveBeenCalledWith('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
  })

  it('unregisters service workers and clears app caches when disabled', async () => {
    const first = mockRegistration('https://www.emuready.com/sw.js')
    const second = mockRegistration('https://www.emuready.com/old-worker.js')
    const { deleteCache, register } = mockBrowserApis(
      [first.registration, second.registration],
      ['emuready_v0.13.2', 'third-party-cache'],
    )

    await syncServiceWorker(false, {
      hostname: 'www.emuready.com',
      protocol: 'https:',
    })

    expect(first.unregister).toHaveBeenCalledTimes(1)
    expect(second.unregister).toHaveBeenCalledTimes(1)
    expect(deleteCache).toHaveBeenCalledWith('emuready_v0.13.2')
    expect(deleteCache).not.toHaveBeenCalledWith('third-party-cache')
    expect(register).not.toHaveBeenCalled()
  })
})
