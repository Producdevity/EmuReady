import { type Metadata } from 'next'
import AdminCpusView from '@/features/hardware/cpu/client/admin/AdminCpusView'

export const metadata: Metadata = {
  title: 'CPUs - Admin',
  description: 'Manage CPU hardware catalog entries for PC Compatibility Reports.',
}

export default function AdminCpusPage() {
  return <AdminCpusView />
}
