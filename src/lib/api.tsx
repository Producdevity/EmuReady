'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact, getQueryKey } from '@trpc/react-query'
import { useState, type PropsWithChildren } from 'react'
import superjson from 'superjson'
import { CACHE_DURATIONS } from '@/data/constants'
import { shouldRetryTRPCQuery } from '@/lib/trpc-client-errors'
import type { AppRouter } from '@/types/trpc'

export const api = createTRPCReact<AppRouter>()

function configureQueryDefaults(queryClient: QueryClient) {
  const lookupDefaults = {
    staleTime: CACHE_DURATIONS.LOOKUP,
    gcTime: CACHE_DURATIONS.LOOKUP_GC,
  }

  queryClient.setQueryDefaults(getQueryKey(api.cpus.options), lookupDefaults)
  queryClient.setQueryDefaults(getQueryKey(api.cpus.getByIds), lookupDefaults)
  queryClient.setQueryDefaults(getQueryKey(api.gpus.options), lookupDefaults)
  queryClient.setQueryDefaults(getQueryKey(api.gpus.getByIds), lookupDefaults)
  queryClient.setQueryDefaults(getQueryKey(api.devices.options), lookupDefaults)
  queryClient.setQueryDefaults(getQueryKey(api.devices.getByIds), lookupDefaults)
  queryClient.setQueryDefaults(getQueryKey(api.socs.options), lookupDefaults)
  queryClient.setQueryDefaults(getQueryKey(api.socs.getByIds), lookupDefaults)
  queryClient.setQueryDefaults(getQueryKey(api.systems.get), lookupDefaults)
  queryClient.setQueryDefaults(getQueryKey(api.emulators.get), lookupDefaults)
  queryClient.setQueryDefaults(getQueryKey(api.performanceScales.get), lookupDefaults)
  queryClient.setQueryDefaults(getQueryKey(api.listings.performanceScales), lookupDefaults)
}

function createQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: CACHE_DURATIONS.SHORT,
        gcTime: CACHE_DURATIONS.MEDIUM,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: shouldRetryTRPCQuery,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: { retry: false },
    },
  })

  configureQueryDefaults(queryClient)

  return queryClient
}

const MAX_URL_LENGTH = 2000

export function TRPCProvider(props: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient)

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
          headers: () => ({}),
          maxURLLength: MAX_URL_LENGTH,
        }),
      ],
    }),
  )

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
    </api.Provider>
  )
}
