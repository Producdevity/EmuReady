import { ShieldAlert } from 'lucide-react'
import { ToggleButton } from '@/components/ui/ToggleButton'

interface Props {
  isActive: boolean
  onToggle: () => void
}

export function ReviewRiskFilterButton(props: Props) {
  return (
    <ToggleButton isPressed={props.isActive} size="sm" icon={ShieldAlert} onToggle={props.onToggle}>
      Risk only
    </ToggleButton>
  )
}
