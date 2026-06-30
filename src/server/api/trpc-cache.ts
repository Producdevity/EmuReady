export const TRPC_PRIVATE_CACHE_CONTROL = 'private, no-store'
export const TRPC_PUBLIC_LOOKUP_CACHE_CONTROL =
  'public, max-age=0, s-maxage=900, stale-while-revalidate=300'

type Endpoint = 'mobile' | 'web'

type CachePolicyInput = {
  endpoint: Endpoint
  method: string
  type: string
  info:
    | {
        isBatchCall: boolean
        calls: readonly { path: string }[]
      }
    | undefined
  hasErrors: boolean
  eagerGeneration?: boolean
  session: unknown
  apiKey?: unknown
  headers?: Headers | null
}

const mobilePublicProcedureCache = new Map<string, string>([
  ['catalog.getDeviceCompatibility', TRPC_PUBLIC_LOOKUP_CACHE_CONTROL],
  ['games.batchBySteamAppIds', TRPC_PUBLIC_LOOKUP_CACHE_CONTROL],
])

const webPublicProcedureCache = new Map<string, string>([
  ['mobile.catalog.getDeviceCompatibility', TRPC_PUBLIC_LOOKUP_CACHE_CONTROL],
  ['mobile.games.batchBySteamAppIds', TRPC_PUBLIC_LOOKUP_CACHE_CONTROL],
  ['cpus.options', TRPC_PUBLIC_LOOKUP_CACHE_CONTROL],
  ['cpus.getByIds', TRPC_PUBLIC_LOOKUP_CACHE_CONTROL],
  ['gpus.options', TRPC_PUBLIC_LOOKUP_CACHE_CONTROL],
  ['gpus.getByIds', TRPC_PUBLIC_LOOKUP_CACHE_CONTROL],
  ['devices.options', TRPC_PUBLIC_LOOKUP_CACHE_CONTROL],
  ['devices.getByIds', TRPC_PUBLIC_LOOKUP_CACHE_CONTROL],
  ['socs.options', TRPC_PUBLIC_LOOKUP_CACHE_CONTROL],
  ['socs.getByIds', TRPC_PUBLIC_LOOKUP_CACHE_CONTROL],
  ['systems.get', TRPC_PUBLIC_LOOKUP_CACHE_CONTROL],
  ['emulators.get', TRPC_PUBLIC_LOOKUP_CACHE_CONTROL],
  ['performanceScales.get', TRPC_PUBLIC_LOOKUP_CACHE_CONTROL],
])

function getProcedureCachePolicy(endpoint: Endpoint, path: string): string | undefined {
  if (endpoint === 'mobile') return mobilePublicProcedureCache.get(path)

  return webPublicProcedureCache.get(path)
}

function hasAuthCapableHeaders(headers: Headers | null | undefined): boolean {
  if (!headers) return false

  return Boolean(
    headers.get('authorization') ||
      headers.get('cookie') ||
      headers.get('x-api-key') ||
      headers.get('x-auth-token'),
  )
}

function getSinglePath(
  info: { isBatchCall: boolean; calls: readonly { path: string }[] } | undefined,
): string | null {
  if (!info || info.isBatchCall || info.calls.length !== 1) return null

  return info.calls[0]?.path ?? null
}

export function getTRPCResponseCacheHeaders(input: CachePolicyInput): Record<string, string> {
  const path = getSinglePath(input.info)
  const cacheControl = path ? getProcedureCachePolicy(input.endpoint, path) : undefined

  if (
    cacheControl &&
    input.method === 'GET' &&
    input.type === 'query' &&
    !input.hasErrors &&
    input.eagerGeneration !== true &&
    !input.session &&
    !input.apiKey &&
    !hasAuthCapableHeaders(input.headers)
  ) {
    return { 'Cache-Control': cacheControl }
  }

  return { 'Cache-Control': TRPC_PRIVATE_CACHE_CONTROL }
}
