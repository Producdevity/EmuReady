import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import TitleIdTool from './TitleIdTool'

export default function AdminTitleIdToolsPage() {
  return (
    <AdminPageLayout
      title="Title ID Lookup"
      description="Test title ID provider scoring to mirror the mobile lookup behaviour."
    >
      <TitleIdTool />
    </AdminPageLayout>
  )
}
