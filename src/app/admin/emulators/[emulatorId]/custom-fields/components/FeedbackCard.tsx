'use client'

import { type ReactNode } from 'react'

interface Props {
  title: string
  description: string
  actions?: ReactNode
}

function FeedbackCard(props: Props) {
  return (
    <div className="container mx-auto py-12">
      <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{props.title}</h1>
        <p className="text-gray-600 dark:text-gray-300">{props.description}</p>
        {props.actions ? <div className="flex justify-center">{props.actions}</div> : null}
      </div>
    </div>
  )
}

export default FeedbackCard
