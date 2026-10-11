'use client'

import GenericVerifyButton from '@/components/verify/GenericVerifyButton'

interface Props {
  listingId: string
  emulatorId: string
  authorId: string | null
  isAlreadyVerified: boolean
  verificationId?: string
  onSuccess?: () => void
}

export default function VerifyListingButton(props: Props) {
  return (
    <GenericVerifyButton
      listingId={props.listingId}
      emulatorId={props.emulatorId}
      authorId={props.authorId}
      isAlreadyVerified={props.isAlreadyVerified}
      verificationId={props.verificationId}
      onSuccess={props.onSuccess}
      type="listing"
    />
  )
}
