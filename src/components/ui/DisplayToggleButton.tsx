import { ImageIcon, Type } from 'lucide-react'
import { Button } from '@/components/ui'

interface Props {
  showLogos: boolean
  onToggle: () => void
  isHydrated: boolean
  logoLabel: string
  nameLabel: string
}

export function DisplayToggleButton(props: Props) {
  return (
    <Button
      variant="outline"
      size="sm"
      icon={props.showLogos ? Type : ImageIcon}
      onClick={props.onToggle}
    >
      {props.isHydrated ? (props.showLogos ? props.nameLabel : props.logoLabel) : '...'}
    </Button>
  )
}
