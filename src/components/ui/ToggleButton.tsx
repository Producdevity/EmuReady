'use client'

import { type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/Button'

interface Props {
  isPressed: boolean
  onToggle: () => void
  children: ReactNode
  icon?: LucideIcon
  size?: ButtonSize
  className?: string
  disabled?: boolean
  pressedVariant?: ButtonVariant
  unpressedVariant?: ButtonVariant
}

export function ToggleButton(props: Props) {
  return (
    <Button
      variant={
        props.isPressed
          ? (props.pressedVariant ?? 'primary')
          : (props.unpressedVariant ?? 'outline')
      }
      size={props.size}
      icon={props.icon}
      className={props.className}
      disabled={props.disabled}
      aria-pressed={props.isPressed}
      onClick={props.onToggle}
    >
      {props.children}
    </Button>
  )
}
