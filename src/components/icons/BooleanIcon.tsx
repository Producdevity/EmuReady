import { CircleCheckBig, CircleSlash } from 'lucide-react'

interface Props {
  value: boolean | null | undefined
}

export function BooleanIcon(props: Props) {
  return props.value ? (
    <CircleCheckBig className="w-4 h-4 text-green-600 dark:text-green-400" />
  ) : (
    <CircleSlash className="w-4 h-4 text-red-600 dark:text-red-400" />
  )
}
