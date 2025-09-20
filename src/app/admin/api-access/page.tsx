'use client'

import { redirect } from 'next/navigation'
import { AdminPageLayout } from '@/components/admin'
import { LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'
import { AdminApiAccessPanel } from './components'

export default function ApiAccessPage() {
  const userQuery = api.users.me.useQuery()

  if (userQuery.isLoading) {
    return (
      <AdminPageLayout title="API Access" description="Loading API access controls...">
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      </AdminPageLayout>
    )
  }

  const user = userQuery.data
  if (!user || !hasRolePermission(user.role, Role.DEVELOPER)) {
    return <AccessRestricted />
  }

  if (!hasRolePermission(user.role, Role.ADMIN)) {
    return redirect('/admin/api-access/developer')
  }

  return <AdminApiAccessPanel userRole={user.role} />
}

function AccessRestricted() {
  return (
    <AdminPageLayout title="API Access" description="Manage API keys and usage quotas.">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-700 dark:bg-amber-900/20">
        <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-100">
          Access restricted
        </h2>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-200">
          You do not have permission to view the API access dashboard.
        </p>
      </div>
    </AdminPageLayout>
  )
}
