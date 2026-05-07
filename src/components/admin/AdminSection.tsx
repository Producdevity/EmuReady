import { type PropsWithChildren, type ReactNode } from 'react'

interface Props extends PropsWithChildren {
  title: string
  actions?: ReactNode
}

export function AdminSection(props: Props) {
  return (
    <section className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
      <div className="flex items-center justify-between mb-6 pb-3 border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{props.title}</h2>
        {props.actions ? <div className="flex items-center gap-2">{props.actions}</div> : null}
      </div>
      {props.children}
    </section>
  )
}
