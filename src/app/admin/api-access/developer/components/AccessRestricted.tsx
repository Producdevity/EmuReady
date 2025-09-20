import { AdminPageLayout } from '@/components/admin'

export function AccessRestricted() {
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
