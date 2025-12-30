'use client'

import { useQuery } from '@tanstack/react-query'
import http from '@/rest/http'
import { ms } from '@/utils/time'

const RETROCATALOG_REFERRER = '?referrer=emuready'

interface RetroCatalogDevice {
  modelName: string
  brandName: string
  id: string
  url: string
}

interface UseRetroCatalogDeviceOptions {
  brandName: string
  modelName: string
  enabled?: boolean
}

interface UseRetroCatalogDeviceResult {
  exists: boolean
  url: string | null
  isLoading: boolean
  deviceId: string | null
}

async function fetchRetroCatalogDevice(
  brandName: string,
  modelName: string,
): Promise<RetroCatalogDevice | null> {
  const encodedBrand = encodeURIComponent(brandName)
  const encodedModel = encodeURIComponent(modelName)
  const apiUrl = `/api/retrocatalog/${encodedBrand}/${encodedModel}`

  try {
    const res = await http.get<RetroCatalogDevice[]>(apiUrl)

    if (Array.isArray(res.data) && res.data.length > 0) return res.data[0]

    return null
  } catch {
    return null
  }
}

/**
 * Hook to check if a device exists on RetroCatalog
 * Caches results for 24 hours since device catalog rarely changes
 */
export function useRetroCatalogDevice(
  options: UseRetroCatalogDeviceOptions,
): UseRetroCatalogDeviceResult {
  const enabled = options.enabled ?? true

  const query = useQuery({
    queryKey: ['retrocatalog', options.brandName, options.modelName],
    queryFn: () => fetchRetroCatalogDevice(options.brandName, options.modelName),
    enabled: enabled && Boolean(options.brandName) && Boolean(options.modelName),
    staleTime: ms.hours(24),
    gcTime: ms.hours(48),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const device = query.data

  return {
    exists: Boolean(device),
    url: device ? `${device.url}${RETROCATALOG_REFERRER}` : null,
    isLoading: query.isLoading,
    deviceId: device?.id ?? null,
  }
}
