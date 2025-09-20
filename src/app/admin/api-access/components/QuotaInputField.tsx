import { Input } from '@/components/ui'

interface Props {
  label: string
  value: number | undefined
  onChange: (value: number) => void
  disabled?: boolean
}

export function QuotaInputField(props: Props) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{props.label}</label>
      <Input
        type="number"
        min={0}
        value={props.value ?? 0}
        onChange={(event) => props.onChange(Number(event.target.value || 0))}
        className="w-full"
        disabled={props.disabled}
      />
    </div>
  )
}
