import { Input } from '@/components/ui'
import { type ChangeEventHandler, type ReactNode } from 'react'

type Option = {
  id: string
  name: string
}

interface Props {
  leftIcon?: ReactNode
  label: string
  hideLabel?: boolean
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  options: Option[]
}

function SelectInput(props: Props) {
  return (
    <div>
      {!props.hideLabel && (
        <label className="block mb-1 font-medium">{props.label}</label>
      )}
      <Input
        leftIcon={props.leftIcon}
        name={props.label}
        as="select"
        value={props.value}
        onChange={props.onChange}
        className="mb-0 border bg-gray-200 border-gray-300 text-gray-900 rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      >
        <option value="">Select {props.label}</option>
        {props.options?.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </Input>
    </div>
  )
}

export default SelectInput
