import { useCallback, useMemo } from 'react'

type FilterConfigItem<T> = {
  parse: (raw: string) => T
  serialize: (value: T) => string
  defaultValue: T
}

type FilterConfig<T extends Record<string, unknown>> = {
  [K in keyof T]: FilterConfigItem<T[K]>
}

export interface AdminTableFiltersApi {
  additionalParams: Record<string, string>
  setAdditionalParam: (key: string, value: string) => void
}

export function useAdminFilters<T extends Record<string, unknown>>(
  table: AdminTableFiltersApi,
  config: FilterConfig<T>,
) {
  const filters = useMemo(() => {
    const out = {} as T
    const keys = Object.keys(config) as (keyof T)[]
    for (const key of keys) {
      const raw = table.additionalParams[key as string] ?? ''
      out[key] = config[key].parse(raw) as T[typeof key]
    }
    return out
  }, [table.additionalParams, config])

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      const item = config[key]
      table.setAdditionalParam(key as string, item.serialize(value))
    },
    [table, config],
  )

  const clearAll = useCallback(() => {
    for (const key in config) {
      table.setAdditionalParam(key, '')
    }
  }, [table, config])

  return { filters, setFilter, clearAll }
}
