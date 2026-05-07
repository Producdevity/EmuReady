'use client'

import { type ReactNode } from 'react'
import { ApprovalStatusBadge, Card, LocalizedDate } from '@/components/ui'
import { type ApprovalStatus } from '@orm'

interface Props {
  id: string
  title: string
  authorName: string | null | undefined
  status: ApprovalStatus
  createdAt: Date | string
  children: ReactNode
}

export function AdminListingEditShell(props: Props) {
  return (
    <div className="max-w-4xl">
      <Card className="p-6">
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{props.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">ID: {props.id}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Author: {props.authorName ?? 'Unknown'}
              </p>
            </div>
            <div className="text-right">
              <ApprovalStatusBadge status={props.status} />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Created: <LocalizedDate date={props.createdAt} format="date" />
              </p>
            </div>
          </div>
        </div>

        {props.children}
      </Card>
    </div>
  )
}
