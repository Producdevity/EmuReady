import { isNumber } from 'remeda'
import toast from '@/lib/toast'
import { type Nullable } from '@/types/utils'
import getErrorMessage from './getErrorMessage'

/**
 * Copies the provided text to the clipboard and shows a toast notification.
 * @param rawValue
 * @param label
 */
export function copyToClipboard(
  rawValue: Nullable<string | number>,
  label?: string,
) {
  const value = isNumber(rawValue) ? String(rawValue) : rawValue

  if (!value) return toast.error(`No value ${`for  ${label} `}to copy`)

  navigator.clipboard
    .writeText(value)
    .then(() => toast.success(`Copied ${label ?? 'value'} to clipboard!`))
    .catch((error) => {
      console.error('Failed to copy to clipboard: ', error)
      toast.error(`Failed to copy to clipboard: ${getErrorMessage(error)}`)
    })
}
