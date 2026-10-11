import { revalidateTag } from 'next/cache'
import {
  invalidateListingsSeo,
  invalidatePcListingsSeo,
  invalidateUser,
} from '@/server/cache/invalidation'
import { type AccountDeletionRepository } from './account-deletion.repository'

export class AccountDeletionService {
  constructor(private readonly accounts: AccountDeletionRepository) {}

  async deleteAccount(identity: Parameters<AccountDeletionRepository['deleteAccount']>[0]) {
    const deleted = await this.accounts.deleteAccount(identity)
    if (deleted) {
      await invalidateUser(deleted.id)
      await invalidateListingsSeo(deleted.listings)
      await invalidatePcListingsSeo(deleted.pcListings)
      revalidateTag(`user-${deleted.id}`, { expire: 0 })
    }
    // Deletion must not serve the previous author's identity during background revalidation.
    revalidateTag('listings', { expire: 0 })
    revalidateTag('pc-listings', { expire: 0 })
  }
}
