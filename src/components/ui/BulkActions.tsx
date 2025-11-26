'use client'

import { CheckCircle, XCircle, Trash2, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import { logger } from '@/lib/logger'

interface BulkActionsProps {
  selectedIds: string[]
  totalCount: number
  onSelectAll: (selected: boolean) => void
  onClearSelection: () => void
  actions?: {
    approve?: {
      label: string
      onAction: (ids: string[]) => Promise<void>
      disabled?: boolean
    }
    reject?: {
      label: string
      onAction: (ids: string[], notes?: string) => Promise<void>
      disabled?: boolean
    }
    delete?: {
      label: string
      onAction: (ids: string[]) => Promise<void>
      disabled?: boolean
    }
    openInTabs?: {
      label: string
      getUrl: (id: string) => string
      disabled?: boolean
    }
  }
}

export function BulkActions(props: BulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [rejectionNotes, setRejectionNotes] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  const handleAction = async (
    actionFn: (ids: string[], notes?: string) => Promise<void>,
    notes?: string,
  ) => {
    setIsLoading(true)
    try {
      await actionFn(props.selectedIds, notes)
      props.onClearSelection()
      setShowRejectInput(false)
      setRejectionNotes('')
    } catch (error) {
      logger.error(`Failed to perform bulk action:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = () => {
    if (!props.actions?.reject) return

    if (showRejectInput) {
      handleAction(props.actions.reject.onAction, rejectionNotes).catch(console.error)
    } else {
      setShowRejectInput(true)
    }
  }

  const handleOpenInTabs = () => {
    if (!props.actions?.openInTabs) return

    props.selectedIds.forEach((id) => {
      const url = props.actions!.openInTabs!.getUrl(id)
      window.open(url, '_blank', 'noopener,noreferrer')
    })
  }

  if (props.selectedIds.length === 0) return null

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {props.selectedIds.length} of {props.totalCount} selected
          </span>
          <Button variant="outline" size="sm" onClick={props.onClearSelection} disabled={isLoading}>
            Clear Selection
          </Button>
          {props.selectedIds.length < props.totalCount && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => props.onSelectAll(true)}
              disabled={isLoading}
            >
              Select All
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {props.actions?.openInTabs && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenInTabs}
              disabled={isLoading || props.actions.openInTabs.disabled}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              {props.actions.openInTabs.label}
            </Button>
          )}

          {props.actions?.approve && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAction(props.actions!.approve!.onAction)}
              disabled={isLoading || props.actions.approve.disabled}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              {props.actions.approve.label}
            </Button>
          )}

          {props.actions?.reject && (
            <div className="flex items-center gap-2">
              {showRejectInput && (
                <Input
                  placeholder="Rejection reason (optional)"
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes((e.target as HTMLInputElement).value)}
                  className="w-48"
                  disabled={isLoading}
                />
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleReject}
                disabled={isLoading || props.actions.reject.disabled}
                className="bg-red-600 hover:bg-red-700"
              >
                <XCircle className="w-4 h-4 mr-1" />
                {showRejectInput ? 'Confirm Reject' : props.actions.reject.label}
              </Button>
              {showRejectInput && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowRejectInput(false)
                    setRejectionNotes('')
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}

          {props.actions?.delete && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAction(props.actions!.delete!.onAction)}
              disabled={isLoading || props.actions.delete.disabled}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {props.actions.delete.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
