import { Suspense } from 'react'
import EditEmulatorClientPage from './EditEmulatorClientPage'

interface Props {
  params: Promise<{ emulatorId: string }>
}

export default function EditEmulatorPage(props: Props) {
  return (
    <Suspense fallback={<div className="container mx-auto p-8">Loading emulator...</div>}>
      <EditEmulatorPageContent params={props.params} />
    </Suspense>
  )
}

async function EditEmulatorPageContent(props: Props) {
  const { emulatorId } = await props.params

  return <EditEmulatorClientPage emulatorId={emulatorId} />
}
