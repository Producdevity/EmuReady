import { Suspense } from 'react'
import EditListingClientPage from './EditListingClientPage'

interface Props {
  params: Promise<{ id: string }>
}

export default function EditListingPage(props: Props) {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading listing...</div>}>
      <EditListingPageContent params={props.params} />
    </Suspense>
  )
}

async function EditListingPageContent(props: Props) {
  const { id } = await props.params

  return <EditListingClientPage listingId={id} />
}
