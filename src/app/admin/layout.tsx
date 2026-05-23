import { Suspense, type PropsWithChildren } from 'react'
import AdminLayoutClient from './AdminLayoutClient'

export default function AdminLayout(props: PropsWithChildren) {
  return (
    <Suspense fallback={null}>
      <AdminLayoutClient>{props.children}</AdminLayoutClient>
    </Suspense>
  )
}
