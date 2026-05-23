'use client'

import { ShieldAlert } from 'lucide-react'
import { useId } from 'react'
import { Switch } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Props {
  isActive: boolean
  onToggle: () => void
}

export function ReviewRiskFilterButton(props: Props) {
  const switchId = useId()

  return (
    <div className="inline-flex items-center gap-2">
      <Switch id={switchId} checked={props.isActive} onCheckedChange={() => props.onToggle()} />
      <label
        htmlFor={switchId}
        className={cn(
          'inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium',
          props.isActive ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        <ShieldAlert
          className={cn('size-4', props.isActive ? 'text-amber-500' : 'text-muted-foreground')}
          aria-hidden="true"
        />
        Risk only
      </label>
    </div>
  )
}
