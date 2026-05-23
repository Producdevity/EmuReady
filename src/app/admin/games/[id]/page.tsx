import { Suspense } from 'react'
import AdminGameEditClientPage from './AdminGameEditClientPage'

interface Props {
  params: Promise<{ id: string }>
}

export default function AdminGameEditPage(props: Props) {
  return (
    <Suspense fallback={<div className="space-y-6">Loading game...</div>}>
      <AdminGameEditPageContent params={props.params} />
    </Suspense>
  )
}

async function AdminGameEditPageContent(props: Props) {
  const { id } = await props.params

  return <AdminGameEditClientPage gameId={id} />
}
