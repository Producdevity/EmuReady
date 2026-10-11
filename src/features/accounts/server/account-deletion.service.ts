import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import { revalidateTag } from 'next/cache'
import { type AccountDeletionRepository } from './account-deletion.repository'

export class AccountDeletionService {
  constructor(private readonly accounts: AccountDeletionRepository) {}

  async deleteAccount(userId: string) {
    const identity = await this.accounts.findClerkIdentity(userId)
    if (identity) {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const clerk = await clerkClient()
      try {
        await clerk.users.deleteUser(identity.clerkId)
      } catch (error) {
        // A previous attempt or the user may already have removed the Clerk identity.
        if (!(isClerkAPIResponseError(error) && error.status === 404)) throw error
      }
    }
    await this.deleteAccountData({ id: userId })
  }

  async deleteAccountData(identity: Parameters<AccountDeletionRepository['deleteAccount']>[0]) {
    await this.accounts.deleteAccount(identity)
    // A webhook retry must expire identities even after the database account is gone.
    revalidateTag('users', { expire: 0 })
    revalidateTag('listings', { expire: 0 })
    revalidateTag('pc-listings', { expire: 0 })
  }
}
