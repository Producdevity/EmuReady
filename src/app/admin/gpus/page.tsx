import { type Metadata } from 'next'
import AdminGpusView from '@/features/hardware/gpu/client/admin/AdminGpusView'

export const metadata: Metadata = {
  title: 'GPUs - Admin',
  description: 'Manage GPU hardware catalog entries for PC Compatibility Reports.',
}

export default function AdminGpusPage() {
  return <AdminGpusView />
}
