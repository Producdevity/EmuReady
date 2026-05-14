import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui'

interface Props {
  isActive: boolean
  onToggle: () => void
}

// TODO: refactor to use a toggle instead of a button. if we have one, we should use that or create a reusable button or steal one from chadcn. (see chadcn command in package.json_
export function ReviewRiskFilterButton(props: Props) {
  return (
    <Button
      variant={props.isActive ? 'primary' : 'outline'}
      size="sm"
      icon={ShieldAlert}
      onClick={props.onToggle}
    >
      Risk only
    </Button>
  )
}
