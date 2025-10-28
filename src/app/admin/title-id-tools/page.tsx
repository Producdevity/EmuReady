'use client'

import { useState } from 'react'
import { AdminPageLayout } from '@/components/admin/AdminPageLayout'
import { cn } from '@/lib/utils'
import { BatchSteamLookup } from './components/BatchSteamLookup'
import TitleIdTool from './TitleIdTool'

type Tab = 'single' | 'batch'

export default function AdminTitleIdToolsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('single')

  return (
    <AdminPageLayout
      title="Title ID & Steam Lookup Tools"
      description="Test title ID provider scoring and batch Steam App ID lookups for mobile integrations."
    >
      <div className="space-y-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={cn(
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors',
                activeTab === 'single'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300',
              )}
            >
              Single Game Search
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('batch')}
              className={cn(
                'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors',
                activeTab === 'batch'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300',
              )}
            >
              Batch Steam Lookup
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'single' ? <TitleIdTool /> : <BatchSteamLookup />}
        </div>
      </div>
    </AdminPageLayout>
  )
}
