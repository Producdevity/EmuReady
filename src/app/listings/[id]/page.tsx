import { notFound } from 'next/navigation'
import { getListingById, getListingUpVotes, getListingVotes } from './data'
import ListingDetailsClient from './ListingDetailsClient'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ListingDetailsPage(props: Props) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)

  // Fetch the listing directly from the database using Prisma
  const listing = await getListingById(id)

  if (!listing) notFound()

  // Get vote counts and user's vote if logged in
  const upVotes = await getListingUpVotes(listing.id)
  const totalVotes = listing._count.votes
  const successRate = totalVotes > 0 ? upVotes / totalVotes : 0
  
  // Get user's vote if logged in
  let userVote = null
  if (session?.user?.id) {
    const votes = await getListingVotes(listing.id, session.user.id)
    userVote = votes.length > 0 ? votes[0].value : null
  }

  // Pass all needed props to the client component
  return (
    <ListingDetailsClient
      listing={JSON.parse(JSON.stringify(listing))}
      successRate={successRate}
      upVotes={upVotes}
      totalVotes={totalVotes}
      userVote={userVote}
    />
  )
}
