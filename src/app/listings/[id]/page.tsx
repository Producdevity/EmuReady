import { notFound } from 'next/navigation'
import { getListingById, getListingUpVotes } from './data'
import ListingDetailsClient from './ListingDetailsClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ListingDetailsPage(props: Props) {
  const { id } = await props.params

  // Fetch the listing directly from the database using Prisma
  const listing = await getListingById(id)

  if (!listing) notFound()

  // Calculate success rate
  const upVotes = await getListingUpVotes(listing.id)
  const totalVotes = listing._count.votes
  const successRate = totalVotes > 0 ? upVotes / totalVotes : 0

  // Pass all needed props to the client component
  return (
    <ListingDetailsClient
      listing={JSON.parse(JSON.stringify(listing))}
      successRate={successRate}
    />
  )
}
