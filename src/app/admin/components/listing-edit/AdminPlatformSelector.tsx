'use client'

import { keepPreviousData } from '@tanstack/react-query'
import { useMemo } from 'react'
import { SelectInput } from '@/components/ui'
import { api } from '@/lib/api'
import { PcOs } from '@orm'

export type PlatformCompatibility =
  | { kind: 'device'; deviceId: string | undefined }
  | { kind: 'os'; os: PcOs | null | undefined }

interface Props {
  value: string | null | undefined
  onChange: (platformId: string | null) => void
  compatibility: PlatformCompatibility
  label?: string
  hideLabel?: boolean
}

export function AdminPlatformSelector(props: Props) {
  const hasCompatibilityContext =
    (props.compatibility.kind === 'device' && !!props.compatibility.deviceId) ||
    (props.compatibility.kind === 'os' && !!props.compatibility.os)

  const compatibleQuery = api.platforms.getCompatible.useQuery(
    props.compatibility.kind === 'device'
      ? { kind: 'device', deviceId: props.compatibility.deviceId ?? '' }
      : { kind: 'os', os: props.compatibility.os ?? PcOs.OTHER },
    { enabled: hasCompatibilityContext, placeholderData: keepPreviousData },
  )

  const fallbackQuery = api.platforms.get.useQuery(undefined, {
    enabled: !hasCompatibilityContext,
    placeholderData: keepPreviousData,
  })

  const platforms = useMemo(
    () => (hasCompatibilityContext ? compatibleQuery.data : fallbackQuery.data) ?? [],
    [hasCompatibilityContext, compatibleQuery.data, fallbackQuery.data],
  )

  const options = useMemo(() => platforms.map((p) => ({ id: p.id, name: p.name })), [platforms])

  return (
    <SelectInput
      label={props.label ?? 'Platform'}
      hideLabel={props.hideLabel}
      value={props.value ?? ''}
      onChange={(ev) => {
        const next = ev.target.value
        props.onChange(next === '' ? null : next)
      }}
      options={options}
    />
  )
}
