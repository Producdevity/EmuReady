import toast from '@/lib/toast'
import { type Nullable } from '@/types/utils'
import getErrorMessage from './getErrorMessage'

/**
 * Copies the provided text to the clipboard and shows a toast notification.
 * @param text
 * @param label
 */
export function copyToClipboard(text: Nullable<string>, label?: string) {
  if (!text) return toast.error(`No value ${`for  ${label} `}to copy`)

  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(`Copied ${`${label} `}to clipboard!`))
    .catch((error) => {
      console.error('Failed to copy to clipboard: ', error)
      toast.error(`Failed to copy to clipboard: ${getErrorMessage(error)}`)
    })
}
