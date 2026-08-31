import { describe, expect, it } from 'vitest'
import {
  getTRPCResponseCacheHeaders,
  TRPC_PRIVATE_CACHE_CONTROL,
  TRPC_PUBLIC_LOOKUP_CACHE_CONTROL,
} from './trpc-cache'

function requestInfo(paths: string[], isBatchCall = false) {
  return {
    isBatchCall,
    calls: paths.map((path) => ({ path })),
  }
}

describe('getTRPCResponseCacheHeaders', () => {
  it('publicly caches anonymous mobile catalog GET queries', () => {
    const headers = getTRPCResponseCacheHeaders({
      endpoint: 'mobile',
      method: 'GET',
      type: 'query',
      info: requestInfo(['catalog.getDeviceCompatibility']),
      hasErrors: false,
      session: null,
      apiKey: null,
      headers: new Headers(),
    })

    expect(headers['Cache-Control']).toBe(TRPC_PUBLIC_LOOKUP_CACHE_CONTROL)
  })

  it('publicly caches the web mobile compatibility alias only when anonymous', () => {
    const headers = getTRPCResponseCacheHeaders({
      endpoint: 'web',
      method: 'GET',
      type: 'query',
      info: requestInfo(['mobile.games.batchBySteamAppIds']),
      hasErrors: false,
      session: null,
      headers: new Headers(),
    })

    expect(headers['Cache-Control']).toBe(TRPC_PUBLIC_LOOKUP_CACHE_CONTROL)
  })

  it('publicly caches anonymous web lookup queries that are already client lookup data', () => {
    const headers = getTRPCResponseCacheHeaders({
      endpoint: 'web',
      method: 'GET',
      type: 'query',
      info: requestInfo(['devices.options']),
      hasErrors: false,
      session: null,
      headers: new Headers(),
    })

    expect(headers['Cache-Control']).toBe(TRPC_PUBLIC_LOOKUP_CACHE_CONTROL)
  })

  it('keeps authenticated requests private even for cacheable procedure paths', () => {
    const headers = getTRPCResponseCacheHeaders({
      endpoint: 'mobile',
      method: 'GET',
      type: 'query',
      info: requestInfo(['catalog.getDeviceCompatibility']),
      hasErrors: false,
      session: { user: { id: 'user-1' } },
      apiKey: null,
      headers: new Headers(),
    })

    expect(headers['Cache-Control']).toBe(TRPC_PRIVATE_CACHE_CONTROL)
  })

  it('keeps requests with auth-capable headers private when no session resolved', () => {
    const headers = getTRPCResponseCacheHeaders({
      endpoint: 'mobile',
      method: 'GET',
      type: 'query',
      info: requestInfo(['games.batchBySteamAppIds']),
      hasErrors: false,
      session: null,
      apiKey: null,
      headers: new Headers({ authorization: 'Bearer invalid-token' }),
    })

    expect(headers['Cache-Control']).toBe(TRPC_PRIVATE_CACHE_CONTROL)
  })

  it('keeps batched requests private even when every path is individually cacheable', () => {
    const headers = getTRPCResponseCacheHeaders({
      endpoint: 'mobile',
      method: 'GET',
      type: 'query',
      info: requestInfo(['catalog.getDeviceCompatibility', 'games.batchBySteamAppIds'], true),
      hasErrors: false,
      session: null,
      apiKey: null,
      headers: new Headers(),
    })

    expect(headers['Cache-Control']).toBe(TRPC_PRIVATE_CACHE_CONTROL)
  })

  it('keeps eagerly generated response metadata private', () => {
    const headers = getTRPCResponseCacheHeaders({
      endpoint: 'mobile',
      method: 'GET',
      type: 'query',
      info: requestInfo(['catalog.getDeviceCompatibility']),
      hasErrors: false,
      eagerGeneration: true,
      session: null,
      apiKey: null,
      headers: new Headers(),
    })

    expect(headers['Cache-Control']).toBe(TRPC_PRIVATE_CACHE_CONTROL)
  })

  it('keeps POST, mutation, and error responses private', () => {
    const baseInput = {
      endpoint: 'mobile' as const,
      info: requestInfo(['catalog.getDeviceCompatibility']),
      session: null,
      apiKey: null,
      headers: new Headers(),
    }

    expect(
      getTRPCResponseCacheHeaders({
        ...baseInput,
        method: 'POST',
        type: 'query',
        hasErrors: false,
      })['Cache-Control'],
    ).toBe(TRPC_PRIVATE_CACHE_CONTROL)

    expect(
      getTRPCResponseCacheHeaders({
        ...baseInput,
        method: 'GET',
        type: 'mutation',
        hasErrors: false,
      })['Cache-Control'],
    ).toBe(TRPC_PRIVATE_CACHE_CONTROL)

    expect(
      getTRPCResponseCacheHeaders({
        ...baseInput,
        method: 'GET',
        type: 'query',
        hasErrors: true,
      })['Cache-Control'],
    ).toBe(TRPC_PRIVATE_CACHE_CONTROL)
  })
})
