'use client'

import { useMemo } from 'react'
import { api } from '@/lib/api'
import { type CustomFieldValueEntry } from './customFieldSync'

export type { CustomFieldValueEntry }

export function useEmulatorCustomFields(emulatorId: string | undefined) {
  const query = api.customFieldDefinitions.getByEmulator.useQuery(
    { emulatorId: emulatorId ?? '' },
    {
      enabled: !!emulatorId,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  )

  const summary = useMemo(
    () =>
      query.data?.map((field) => ({
        id: field.id,
        label: field.label,
        name: field.name,
      })) ?? [],
    [query.data],
  )

  return { query, summary }
}
