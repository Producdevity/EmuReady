import { useCallback, useEffect, useRef, useState } from 'react'
import { type DriverRelease, fetchDriverVersions } from '../utils/fetchDriverVersions'

export function useDriverVersions() {
  const cache = useRef<DriverRelease[] | null>(null)
  const [data, setData] = useState<DriverRelease[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (cache.current) {
      setData(cache.current)
      return
    }
    try {
      setLoading(true)
      const versions = await fetchDriverVersions()
      cache.current = versions
      setData(versions)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => void load(), [load])

  return { data, error, loading, reload: load }
}
