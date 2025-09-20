'use client'

import { AccessRestricted } from '@/app/admin/api-access/developer/components/AccessRestricted'
import { AdminPageLayout } from '@/components/admin'
import { LoadingSpinner } from '@/components/ui'
import { api } from '@/lib/api'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'
import { DeveloperApiAccessPanel } from '../components'

export default function DeveloperApiAccessPage() {
  const userQuery = api.users.me.useQuery()

  if (userQuery.isLoading) {
    return (
      <AdminPageLayout title="API Access" description="Loading API access dashboard...">
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      </AdminPageLayout>
    )
  }

  const user = userQuery.data
  if (!user) return <AccessRestricted />

  const canViewDeveloperPanel = hasRolePermission(user.role, Role.DEVELOPER)
  const isAdminOrHigher = hasRolePermission(user.role, Role.ADMIN)

  if (!canViewDeveloperPanel && !isAdminOrHigher) return <AccessRestricted />

  return <DeveloperApiAccessPanel canCreateKeys={isAdminOrHigher} />
}
