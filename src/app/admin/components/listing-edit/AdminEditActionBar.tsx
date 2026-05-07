'use client'

import { Button } from '@/components/ui'

interface Props {
  onCancel: () => void
  isSubmitting: boolean
  isDirty: boolean
  saveLabel?: string
}

export function AdminEditActionBar(props: Props) {
  return (
    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
      <Button
        type="button"
        variant="outline"
        onClick={props.onCancel}
        disabled={props.isSubmitting}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        isLoading={props.isSubmitting}
        disabled={props.isSubmitting || !props.isDirty}
      >
        {props.saveLabel ?? 'Save Changes'}
      </Button>
    </div>
  )
}
