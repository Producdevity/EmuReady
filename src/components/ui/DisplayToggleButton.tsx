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
      className="flex items-center gap-2"
      onClick={props.onToggle}
    >
      {props.showLogos ? (
        <>
          <Type className="w-4 h-4" />
          {props.isHydrated ? props.nameLabel : '...'}
        </>
      ) : (
        <>
          <ImageIcon className="w-4 h-4" />
          {props.isHydrated ? props.logoLabel : '...'}
        </>
      )}
    </Button>
  )
}
