import { type BadgeVariant } from '@/components/ui/Badge'

interface KeyLike {
  revokedAt: Date | null
  expiresAt: Date | null
}

interface KeyStatusLabel {
  label: string
  variant: BadgeVariant
}

export function getKeyStatusLabel(key: KeyLike | null): KeyStatusLabel {
  if (!key) {
    return {
      label: 'Unknown',
      variant: 'default',
    }
  }

  if (key.revokedAt) {
    return {
      label: 'Revoked',
      variant: 'danger',
    }
  }

  if (key.expiresAt && key.expiresAt < new Date()) {
    return {
      label: 'Expired',
      variant: 'warning',
    }
  }

  return {
    label: 'Active',
    variant: 'success',
  }
}

export type { KeyStatusLabel }
