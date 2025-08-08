import { type ChangeEventHandler, type ReactNode } from 'react'
import { Input } from '@/components/ui'

interface Option {
  id: string
  name: string
}

interface Props {
  leftIcon?: ReactNode
  label: string
  hideLabel?: boolean
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  className?: string
  options: Option[]
}

export function SelectInput(props: Props) {
  return (
    <div>
      {!props.hideLabel && <label className="block mb-1 font-medium">{props.label}</label>}
      <Input
        leftIcon={props.leftIcon}
        name={props.label}
        as="select"
        value={props.value}
        onChange={props.onChange}
        className={props.className}
      >
        <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          Select {props.label}
        </option>
        {props.options?.map((option) => (
          <option
            key={option.id}
            value={option.id}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {option.name}
          </option>
        ))}
      </Input>
    </div>
  )
}
