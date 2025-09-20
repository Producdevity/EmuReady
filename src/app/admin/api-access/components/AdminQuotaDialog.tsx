import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@/components/ui'
import { API_KEY_LIMITS } from '@/data/constants'
import { QuotaInputField } from './QuotaInputField'
import { type AdminApiKeyRow } from './types'
import { normalizeExpiration } from '../utils/normalize-expiration'

interface QuotaFormState {
  id: string
  monthlyQuota?: number
  weeklyQuota?: number
  burstQuota?: number
  expiresAt?: string | null
}

interface Props {
  keyId: string
  keys: AdminApiKeyRow[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (state: QuotaFormState) => Promise<void>
}

export function AdminQuotaDialog(props: Props) {
  const key = props.keys.find((item) => item.id === props.keyId) ?? null
  const [state, setState] = useState<QuotaFormState>(() => ({
    id: props.keyId,
    monthlyQuota: key?.monthlyQuota ?? API_KEY_LIMITS.DEFAULT_MONTHLY,
    weeklyQuota: key?.weeklyQuota ?? API_KEY_LIMITS.DEFAULT_WEEKLY,
    burstQuota: key?.burstQuota ?? API_KEY_LIMITS.DEFAULT_BURST_PER_MINUTE,
    expiresAt: key?.expiresAt ? new Date(key.expiresAt).toISOString().slice(0, 16) : null,
  }))
  const [dateError, setDateError] = useState<string | null>(null)

  useEffect(() => {
    if (!key) return
    setState({
      id: key.id,
      monthlyQuota: key.monthlyQuota,
      weeklyQuota: key.weeklyQuota,
      burstQuota: key.burstQuota,
      expiresAt: key.expiresAt ? new Date(key.expiresAt).toISOString().slice(0, 16) : null,
    })
    setDateError(null)
  }, [key])

  return (
    <Dialog open={Boolean(key)} onOpenChange={(open) => (!open ? props.onClose() : null)}>
      <DialogContent className="w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle>Update quotas</DialogTitle>
          <DialogDescription>
            Adjust request ceilings and optional expiry for{' '}
            <strong>{key?.name ?? 'this key'}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-3">
          <QuotaInputField
            label="Monthly quota"
            value={state.monthlyQuota}
            onChange={(value) => setState((prev) => ({ ...prev, monthlyQuota: value }))}
          />
          <QuotaInputField
            label="Weekly quota"
            value={state.weeklyQuota}
            onChange={(value) => setState((prev) => ({ ...prev, weeklyQuota: value }))}
          />
          <QuotaInputField
            label="Burst per minute"
            value={state.burstQuota}
            onChange={(value) => setState((prev) => ({ ...prev, burstQuota: value }))}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Expiration (optional)
          </label>
          <Input
            type="datetime-local"
            value={state.expiresAt ?? ''}
            onChange={(event) => {
              setDateError(null)
              setState((prev) => ({ ...prev, expiresAt: event.target.value || null }))
            }}
            className="w-full"
          />
          {dateError && <p className="text-xs text-red-500 dark:text-red-400">{dateError}</p>}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => props.onClose()}
            disabled={props.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={async () => {
              const normalizedExpiration = normalizeExpiration(state.expiresAt)
              if (normalizedExpiration.error) {
                setDateError(normalizedExpiration.error)
                return
              }

              try {
                await props.onSubmit({
                  ...state,
                  expiresAt: normalizedExpiration.iso,
                })
                props.onClose()
              } catch {
                // Error messages handled upstream
              }
            }}
            disabled={props.isSubmitting}
          >
            {props.isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { QuotaFormState }
