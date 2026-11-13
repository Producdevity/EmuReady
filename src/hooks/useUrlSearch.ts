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
  const [draft, setDraft] = useState({ pathname, search, value: search })

  if (draft.pathname !== pathname || draft.search !== search) {
    setDraft({
      pathname,
      search,
      value: draft.pathname === pathname && draft.value.trim() === search ? draft.value : search,
    })
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
  }, [pathname, search])

  const setSearch = useCallback(
    (value: string) => {
      setDraft({ pathname, search, value })
      if (pendingUpdate.current !== null) clearTimeout(pendingUpdate.current)

      function updateUrl() {
        pendingUpdate.current = null
        const params = new URLSearchParams(latestParams.current)
        const normalized = value.trim()
        if (normalized) params.set('search', normalized)
        else params.delete('search')
        params.delete('page')

        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
      }

      if (debounceMs > 0) pendingUpdate.current = setTimeout(updateUrl, debounceMs)
      else updateUrl()
    },
    [debounceMs, pathname, router, search],
  )

  return [draft.value, setSearch, search]
}
