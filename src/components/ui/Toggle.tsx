'use client'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

function Toggle(props: Props) {
  return (
    <label
      className={`inline-flex items-center cursor-pointer ${props.disabled ? 'opacity-50' : ''} ${props.className ?? ''}`}
    >
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={props.checked}
          disabled={props.disabled ?? false}
          onChange={(ev) => props.onChange(ev.target.checked)}
        />
        <div
          className={`w-10 h-5 bg-gray-200 rounded-full peer dark:bg-gray-700 
          ${props.checked ? 'bg-blue-600' : ''}`}
        />
        <div
          className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all
          ${props.checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </div>
      {props.label && (
        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          {props.label}
        </span>
      )}
    </label>
  )
}

export default Toggle
