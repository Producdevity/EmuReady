'use client'

import GenericVerifyButton from '@/components/verify/GenericVerifyButton'

interface Props {
  pcListingId: string
  emulatorId: string
  authorId: string
  isAlreadyVerified: boolean
  verificationId?: string
  onSuccess?: () => void
}

export default function VerifyPcListingButton(props: Props) {
  return (
    <GenericVerifyButton
      listingId={props.pcListingId}
      emulatorId={props.emulatorId}
      authorId={props.authorId}
      isAlreadyVerified={props.isAlreadyVerified}
      verificationId={props.verificationId}
      onSuccess={props.onSuccess}
      type="pcListing"
    />
  )
}
