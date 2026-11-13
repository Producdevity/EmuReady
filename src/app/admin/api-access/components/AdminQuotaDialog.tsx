import { useState } from 'react'
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
  keys: Pick<
    AdminApiKeyRow,
    'id' | 'name' | 'monthlyQuota' | 'weeklyQuota' | 'burstQuota' | 'expiresAt'
  >[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (state: QuotaFormState) => Promise<void>
}

export function AdminQuotaDialog(props: Props) {
  const apiKey = props.keys.find((item) => item.id === props.keyId)
  if (!apiKey) return null
  return (
    <QuotaForm
      key={apiKey.id}
      apiKey={apiKey}
      isSubmitting={props.isSubmitting}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
    />
  )
}

type FormProps = Omit<Props, 'keyId' | 'keys'> & { apiKey: Props['keys'][number] }

function QuotaForm(props: FormProps) {
  const [state, setState] = useState<QuotaFormState>(() => ({
    id: props.apiKey.id,
    monthlyQuota: props.apiKey.monthlyQuota,
    weeklyQuota: props.apiKey.weeklyQuota,
    burstQuota: props.apiKey.burstQuota,
    expiresAt: props.apiKey.expiresAt
      ? new Date(props.apiKey.expiresAt).toISOString().slice(0, 16)
      : null,
  }))
  const [dateError, setDateError] = useState<string | null>(null)

  return (
    <Dialog open={true} onOpenChange={(open) => (!open ? props.onClose() : null)}>
      <DialogContent className="w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle>Update quotas</DialogTitle>
          <DialogDescription>
            Adjust request ceilings and optional expiry for <strong>{props.apiKey.name}</strong>.
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
