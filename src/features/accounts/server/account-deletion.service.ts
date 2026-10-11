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
    if (!deleted) return
    await invalidateUser(deleted.id)
    await invalidateListingsSeo(deleted.listings)
    await invalidatePcListingsSeo(deleted.pcListings)
  }
}
