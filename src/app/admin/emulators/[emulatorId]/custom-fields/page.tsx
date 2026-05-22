import { Suspense } from 'react'
import EmulatorCustomFieldsClientPage from './EmulatorCustomFieldsClientPage'

interface Props {
  params: Promise<{ emulatorId: string }>
}

export default function EmulatorCustomFieldsPage(props: Props) {
  return (
    <Suspense fallback={<div className="flex justify-center py-12">Loading custom fields...</div>}>
      <EmulatorCustomFieldsPageContent params={props.params} />
    </Suspense>
  )
}

async function EmulatorCustomFieldsPageContent(props: Props) {
  const { emulatorId } = await props.params

  return <EmulatorCustomFieldsClientPage emulatorId={emulatorId} />
}
