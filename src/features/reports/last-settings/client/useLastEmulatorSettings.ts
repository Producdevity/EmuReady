import storageKeys from '@/data/storageKeys'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import toast from '@/lib/toast'
import { type CustomFieldDefinitionWithOptions } from '@/utils/custom-field-validation'
import {
  applyReusableEmulatorSettings,
  createLastEmulatorSettings,
  getReusableEmulatorSettings,
  hasCustomSettingsDraft,
  type SubmittedSettings,
} from '../shared/settings'
import { LastEmulatorSettingsSchema } from '../shared/settings.schemas'

interface Props {
  userId: string | undefined
  emulatorId: string
  fields: readonly CustomFieldDefinitionWithOptions[]
  enabled: boolean
  values: SubmittedSettings
  blocked: boolean
}

export function useLastEmulatorSettings(props: Props) {
  const enabled = Boolean(props.userId && props.emulatorId)
  const [snapshot, setSnapshot, hydrated] = useLocalStorage(
    `${storageKeys.newListing.lastUsedEmulatorSettings}:${props.userId ?? ''}:${props.emulatorId}`,
    null,
    LastEmulatorSettingsSchema,
    enabled,
  )
  const reusable = getReusableEmulatorSettings(snapshot, props.fields)
  const available =
    enabled &&
    props.enabled &&
    hydrated &&
    reusable.length > 0 &&
    !props.blocked &&
    !hasCustomSettingsDraft(props.values, props.fields)

  function apply(values: SubmittedSettings, dirty: boolean) {
    if (!available || dirty || hasCustomSettingsDraft(values, props.fields)) return null
    return applyReusableEmulatorSettings(values, reusable, props.fields)
  }

  function remember(authorId: string, emulatorId: string, values: SubmittedSettings) {
    if (!enabled || authorId !== props.userId || emulatorId !== props.emulatorId) return
    try {
      setSnapshot(createLastEmulatorSettings(values), { notifyOnError: false })
    } catch {
      toast.warning('Report submitted, but your last emulator settings could not be saved.')
    }
  }

  return {
    reusable,
    available,
    apply,
    remember,
  }
}
