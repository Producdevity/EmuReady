import { useState, useEffect, useCallback, useMemo, useRef, useSyncExternalStore } from 'react'
import { type z } from 'zod'
import toast from '@/lib/toast'
import useMounted from './useMounted'

interface Draft<T> {
  key: string
  snapshot: string | null | undefined
  value: T
}

function serverSnapshot() {
  return undefined
}

function parseStoredValue<T>(
  snapshot: string | null | undefined,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
) {
  if (snapshot == null) return { success: false as const, error: null }
  try {
    const value: unknown = JSON.parse(snapshot)
    return schema.safeParse(value)
  } catch (error) {
    return { success: false as const, error }
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  enabled = true,
) {
  const [draft, setDraft] = useState<Draft<T> | null>(null)
  const draftRef = useRef<Draft<T> | null>(null)
  const isHydrated = useMounted()

  const getSnapshot = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return undefined
    try {
      return window.localStorage.getItem(key)
    } catch {
      return undefined
    }
  }, [enabled, key])

  const subscribe = useCallback(
    (notify: () => void) => {
      if (!enabled || typeof window === 'undefined') return () => {}
      function onStorage(event: StorageEvent) {
        if (event.key !== null && event.key !== key) return
        const currentDraft = draftRef.current
        if (currentDraft && (currentDraft.key !== key || currentDraft.snapshot !== getSnapshot())) {
          draftRef.current = null
          setDraft(null)
        }
        notify()
      }
      window.addEventListener('storage', onStorage)
      return () => window.removeEventListener('storage', onStorage)
    },
    [enabled, getSnapshot, key],
  )

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot)
  const parsed = useMemo(() => parseStoredValue(snapshot, schema), [snapshot, schema])
  const value =
    draft?.key === key && draft.snapshot === snapshot
      ? draft.value
      : parsed.success
        ? parsed.data
        : initialValue

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    if (!parsed.success && parsed.error) {
      console.error(
        `Error reading localStorage key "${key}":`,
        parsed.error instanceof Error ? parsed.error.message : parsed.error,
      )
      toast.warning('Failed to load your preferences. Please refresh the page to try again.')
    } else if (snapshot === undefined) {
      try {
        window.localStorage.getItem(key)
      } catch (error) {
        console.error(
          `Error reading localStorage key "${key}":`,
          error instanceof Error ? error.message : error,
        )
      }
    }
  }, [enabled, key, parsed, snapshot])

  const setValue = useCallback(
    (update: T | ((previous: T) => T), options?: { notifyOnError?: boolean }) => {
      let nextSnapshot = getSnapshot()
      const previousDraft = draftRef.current
      const stored = parseStoredValue(nextSnapshot, schema)
      const previousValue =
        previousDraft?.key === key && previousDraft.snapshot === nextSnapshot
          ? previousDraft.value
          : stored.success
            ? stored.data
            : initialValue
      const nextValue = update instanceof Function ? update(previousValue) : update
      let changed = false
      let failed = false
      let failure: unknown
      try {
        if (enabled && typeof window !== 'undefined') {
          const serialized = JSON.stringify(nextValue) ?? null
          if (serialized !== nextSnapshot) {
            if (serialized === null) window.localStorage.removeItem(key)
            else window.localStorage.setItem(key, serialized)
            changed = true
          }
          nextSnapshot = serialized
        }
      } catch (error) {
        failed = true
        failure = error
      }
      const nextDraft = { key, snapshot: nextSnapshot, value: nextValue }
      draftRef.current = nextDraft
      setDraft(nextDraft)
      if (failed) {
        console.warn(`Error setting localStorage key "${key}":`, failure)
        if (options?.notifyOnError !== false)
          toast.warning('Failed to save your preferences. Please try again.')
        throw failure
      }
      if (changed && enabled && typeof window !== 'undefined') {
        // Browsers send storage events to other documents; notify this document too.
        window.dispatchEvent(new StorageEvent('storage', { key }))
      }
    },
    [enabled, getSnapshot, initialValue, key, schema],
  )

  return [value, setValue, isHydrated] as const
}
