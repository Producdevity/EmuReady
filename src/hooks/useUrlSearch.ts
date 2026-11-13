import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

export function useUrlSearch(debounceMs = 300): [string, (value: string) => void, string] {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const serializedParams = searchParams.toString()
  const latestParams = useRef(serializedParams)
  const pendingUpdate = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pendingSearch, setPendingSearch] = useState<string | null>(null)
  const [draft, setDraft] = useState({ pathname, search, value: search, navigationVersion: 0 })

  if (draft.pathname !== pathname || draft.search !== search) {
    const ownNavigation = draft.pathname === pathname && pendingSearch === search
    setDraft({
      pathname,
      search,
      value:
        ownNavigation || (draft.pathname === pathname && draft.value.trim() === search)
          ? draft.value
          : search,
      navigationVersion: draft.navigationVersion + (ownNavigation ? 0 : 1),
    })
    setPendingSearch(null)
  }

  useEffect(() => {
    latestParams.current = serializedParams
  }, [serializedParams])

  useEffect(() => {
    return () => {
      if (pendingUpdate.current !== null) {
        clearTimeout(pendingUpdate.current)
        pendingUpdate.current = null
      }
    }
  }, [draft.navigationVersion])

  const setSearch = useCallback(
    (value: string) => {
      setDraft((current) => ({ ...current, pathname, search, value }))
      if (pendingUpdate.current !== null) clearTimeout(pendingUpdate.current)

      function updateUrl() {
        pendingUpdate.current = null
        const params = new URLSearchParams(latestParams.current)
        const normalized = value.trim()
        if (
          normalized === (params.get('search') ?? '') &&
          (pendingSearch === null || pendingSearch === normalized)
        )
          return
        if (normalized) params.set('search', normalized)
        else params.delete('search')
        params.delete('page')

        const query = params.toString()
        setPendingSearch(normalized)
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
      }

      if (debounceMs > 0) pendingUpdate.current = setTimeout(updateUrl, debounceMs)
      else updateUrl()
    },
    [debounceMs, pathname, pendingSearch, router, search],
  )

  return [draft.value, setSearch, search]
}
