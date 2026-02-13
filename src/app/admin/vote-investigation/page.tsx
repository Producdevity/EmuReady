'use client'

import { AdminPageLayout } from '@/components/admin'
import VoteAuthorSection from './components/VoteAuthorSection'
import VoterSection from './components/VoterSection'

function AdminVoteInvestigationPage() {
  return (
    <AdminPageLayout
      title="Vote Investigation"
      description="Investigate vote patterns and detect manipulation across the platform"
    >
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-8">
        <VoterSection />
        <hr className="border-gray-200 dark:border-gray-700" />
        <VoteAuthorSection />
      </div>
    </AdminPageLayout>
  )
}

export default AdminVoteInvestigationPage
