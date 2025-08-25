import { TrendingDown, TrendingUp } from 'lucide-react'

interface Props {
  change: number
}

export function TrendIcon(props: Props) {
  return props.change > 0 ? (
    <TrendingUp className="h-4 w-4 text-green-500" />
  ) : props.change < 0 ? (
    <TrendingDown className="h-4 w-4 text-red-500" />
  ) : null
}
