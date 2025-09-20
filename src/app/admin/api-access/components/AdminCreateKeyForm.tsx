import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Button, Input, RoleBadge, Toggle } from '@/components/ui'
import { Autocomplete } from '@/components/ui/form/Autocomplete'
import { API_KEY_LIMITS } from '@/data/constants'
import { api } from '@/lib/api'
import toast from '@/lib/toast'
import { cn } from '@/lib/utils'
import { QuotaInputField } from './QuotaInputField'
import { type UserOption } from './types'
import { normalizeExpiration } from '../utils/normalize-expiration'

interface SavedQuotas {
  monthlyQuota: number
  weeklyQuota: number
  burstQuota: number
}

interface FormState {
  userId: string
  name?: string
  monthlyQuota: number
  weeklyQuota: number
  burstQuota: number
  expiresAt: string | null
  isSystemKey: boolean
}

interface AdminCreateFormState {
  userId: string
  name?: string
  monthlyQuota?: number
  weeklyQuota?: number
  burstQuota?: number
  expiresAt?: string | null
  isSystemKey: boolean
}

interface Props {
  isSubmitting: boolean
  canCreateSystemKey: boolean
  onSubmit: (state: AdminCreateFormState) => Promise<void>
}

const DEFAULT_ADMIN_FORM_STATE: FormState = {
  userId: '',
  name: undefined,
  monthlyQuota: API_KEY_LIMITS.DEFAULT_MONTHLY,
  weeklyQuota: API_KEY_LIMITS.DEFAULT_WEEKLY,
  burstQuota: API_KEY_LIMITS.DEFAULT_BURST_PER_MINUTE,
  expiresAt: null,
  isSystemKey: false,
}

const DEFAULT_SAVED_QUOTAS: SavedQuotas = {
  monthlyQuota: API_KEY_LIMITS.DEFAULT_MONTHLY,
  weeklyQuota: API_KEY_LIMITS.DEFAULT_WEEKLY,
  burstQuota: API_KEY_LIMITS.DEFAULT_BURST_PER_MINUTE,
}

export function AdminCreateKeyForm(props: Props) {
  const utils = api.useUtils()
  const [formState, setFormState] = useState<FormState>(DEFAULT_ADMIN_FORM_STATE)
  const [options, setOptions] = useState<UserOption[]>([])
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null)
  const [savedQuotas, setSavedQuotas] = useState<SavedQuotas>(DEFAULT_SAVED_QUOTAS)
  const [dateError, setDateError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedUser) return
    setFormState((prev) => ({ ...prev, userId: selectedUser.id }))
  }, [selectedUser])

  const isSystemKey = formState.isSystemKey
  const quotaDisplayState = useMemo(() => {
    if (!isSystemKey) return formState
    return {
      ...formState,
      monthlyQuota: savedQuotas.monthlyQuota,
      weeklyQuota: savedQuotas.weeklyQuota,
      burstQuota: savedQuotas.burstQuota,
    }
  }, [formState, isSystemKey, savedQuotas])

  const handleUserChange = (value: string | null) => {
    setFormState((prev) => ({ ...prev, userId: value ?? '' }))
    const nextSelected = options.find((option) => option.id === value) ?? null
    setSelectedUser(nextSelected)
  }

  const handleSystemKeyToggle = (nextValue: boolean) => {
    if (!props.canCreateSystemKey) return

    setFormState((prev) => ({
      ...prev,
      isSystemKey: nextValue,
      monthlyQuota: nextValue ? DEFAULT_ADMIN_FORM_STATE.monthlyQuota : savedQuotas.monthlyQuota,
      weeklyQuota: nextValue ? DEFAULT_ADMIN_FORM_STATE.weeklyQuota : savedQuotas.weeklyQuota,
      burstQuota: nextValue ? DEFAULT_ADMIN_FORM_STATE.burstQuota : savedQuotas.burstQuota,
    }))

    if (nextValue) {
      setSavedQuotas({
        monthlyQuota: formState.monthlyQuota,
        weeklyQuota: formState.weeklyQuota,
        burstQuota: formState.burstQuota,
      })
    }

    setDateError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formState.userId) {
      toast.error('A target user is required to create a key.')
      return
    }

    const sanitizedName = formState.name?.trim()
    const normalizedExpiration = normalizeExpiration(formState.expiresAt)
    if (normalizedExpiration.error) {
      setDateError(normalizedExpiration.error)
      return
    }

    const payload: AdminCreateFormState = {
      userId: formState.userId,
      name: sanitizedName ? sanitizedName : undefined,
      expiresAt: normalizedExpiration.iso,
      isSystemKey: formState.isSystemKey,
    }

    if (!isSystemKey) {
      payload.monthlyQuota = formState.monthlyQuota
      payload.weeklyQuota = formState.weeklyQuota
      payload.burstQuota = formState.burstQuota
    }

    try {
      await props.onSubmit(payload)
      setFormState(DEFAULT_ADMIN_FORM_STATE)
      setSavedQuotas(DEFAULT_SAVED_QUOTAS)
      setSelectedUser(null)
      setDateError(null)
    } catch {
      // Error messages handled upstream
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Provision new key</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Assign keys to developers or service accounts. System keys bypass rate limits and are
        reserved for official applications.
      </p>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Assign to user
        </label>
        <Autocomplete<UserOption>
          value={formState.userId || null}
          onChange={handleUserChange}
          loadItems={async (query) => {
            const results = await utils.users.searchUsers.fetch({
              query: query || undefined,
              limit: 10,
            })
            setOptions(results)
            return results
          }}
          optionToValue={(option) => option.id}
          optionToLabel={(option) => option.name ?? option.email ?? option.id}
          customOptionRenderer={(option, isHighlighted) => (
            <div
              className={cn(
                'flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm',
                isHighlighted ? 'bg-blue-50 dark:bg-blue-900/30' : undefined,
              )}
            >
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {option.name ?? option.email ?? option.id}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{option.email}</div>
              </div>
              <RoleBadge role={option.role} />
            </div>
          )}
          minCharsToTrigger={2}
          placeholder="Search users by name or email"
          className="w-full"
        />
        {selectedUser && (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900/40">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedUser.name ?? selectedUser.email ?? selectedUser.id}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
              </div>
              <RoleBadge role={selectedUser.role} />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Label</label>
        <Input
          value={formState.name ?? ''}
          onChange={(event) =>
            setFormState((prev) => ({ ...prev, name: event.target.value || undefined }))
          }
          placeholder="Optional label for the key"
          className="w-full"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <QuotaInputField
          label="Monthly quota"
          value={quotaDisplayState.monthlyQuota}
          onChange={(value) => setFormState((prev) => ({ ...prev, monthlyQuota: value }))}
          disabled={isSystemKey}
        />
        <QuotaInputField
          label="Weekly quota"
          value={quotaDisplayState.weeklyQuota}
          onChange={(value) => setFormState((prev) => ({ ...prev, weeklyQuota: value }))}
          disabled={isSystemKey}
        />
        <QuotaInputField
          label="Burst per minute"
          value={quotaDisplayState.burstQuota}
          onChange={(value) => setFormState((prev) => ({ ...prev, burstQuota: value }))}
          disabled={isSystemKey}
        />
      </div>

      {isSystemKey ? (
        <p className="text-xs text-blue-600 dark:text-blue-300">
          System keys bypass rate limits; quota values above are ignored.
        </p>
      ) : null}

      <div className="grid gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Expiration (optional)
        </label>
        <Input
          type="datetime-local"
          value={formState.expiresAt ?? ''}
          onChange={(event) => {
            setDateError(null)
            setFormState((prev) => ({ ...prev, expiresAt: event.target.value || null }))
          }}
          className="w-full"
        />
        {dateError && <p className="text-xs text-red-500 dark:text-red-400">{dateError}</p>}
      </div>

      <div className="flex items-center gap-3 text-sm">
        <Toggle
          checked={isSystemKey}
          onChange={handleSystemKeyToggle}
          disabled={!props.canCreateSystemKey}
          size="sm"
        />
        <span
          className={cn(
            'font-medium text-gray-700 dark:text-gray-300',
            !props.canCreateSystemKey ? 'opacity-60' : undefined,
          )}
        >
          Create as system key (unlimited)
        </span>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={props.isSubmitting}>
          {props.isSubmitting ? 'Creating…' : 'Create key'}
        </Button>
      </div>
    </form>
  )
}

export type { AdminCreateFormState }
