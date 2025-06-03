'use client'

import toast from '@/lib/toast'
import { useState } from 'react'
import EmulatorModal from '@/app/admin/emulators/components/EmulatorModal'
import Link from 'next/link'
import { api } from '@/lib/api'
import {
  Button,
  useConfirmDialog,
  ColumnVisibilityControl,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui'
import { Settings, Pencil, Trash2 } from 'lucide-react'
import getErrorMessage from '@/utils/getErrorMessage'
import storageKeys from '@/data/storageKeys'
import useColumnVisibility, {
  type ColumnDefinition,
} from '@/hooks/useColumnVisibility'
import { type RouterInput } from '@/types/trpc'

const actionButtonClasses =
  'inline-flex items-center justify-center font-medium transition-colors rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none px-3 py-1.5 text-sm border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800'

const EMULATORS_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'Emulator Name', defaultVisible: true },
  { key: 'actions', label: 'Actions', alwaysVisible: true },
]

function AdminEmulatorsPage() {
  const columnVisibility = useColumnVisibility(EMULATORS_COLUMNS, {
    storageKey: storageKeys.columnVisibility.adminEmulators,
  })

  const { data: emulators, refetch } = api.emulators.get.useQuery()
  const deleteEmulator = api.emulators.delete.useMutation()
  const confirm = useConfirmDialog()

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [emulatorName, setEmulatorName] = useState('')

  const openModal = (emulator?: { id: string; name: string }) => {
    setEditId(emulator?.id ?? null)
    setEmulatorName(emulator?.name ?? '')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
    setEmulatorName('')
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Emulator',
      description:
        'Are you sure you want to delete this emulator? This action cannot be undone.',
    })

    if (!confirmed) return

    try {
      await deleteEmulator.mutateAsync({
        id,
      } satisfies RouterInput['emulators']['delete'])
      refetch().catch(console.error)
      toast.success('Emulator deleted successfully!')
    } catch (err) {
      toast.error(`Failed to delete emulator: ${getErrorMessage(err)}`)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Emulators</h1>
        <div className="flex items-center gap-3">
          <ColumnVisibilityControl
            columns={EMULATORS_COLUMNS}
            columnVisibility={columnVisibility}
          />
          <Button onClick={() => openModal()}>Add Emulator</Button>
        </div>
      </div>
      <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl">
          <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
            <tr>
              {columnVisibility.isColumnVisible('name') && (
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Emulator Name
                </th>
              )}
              {columnVisibility.isColumnVisible('actions') && (
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {emulators?.map((emulator) => (
              <tr
                key={emulator.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {columnVisibility.isColumnVisible('name') && (
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/emulators/${emulator.id}`}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      {emulator.name}
                    </Link>
                  </td>
                )}
                {columnVisibility.isColumnVisible('actions') && (
                  <td className="px-4 py-2 flex gap-2 justify-end">
                    <Link
                      href={`/admin/emulators/${emulator.id}/custom-fields`}
                      className={actionButtonClasses}
                    >
                      <Settings className="mr-2 h-4 w-4" /> Custom Fields
                    </Link>
                    <Link
                      href={`/admin/emulators/${emulator.id}`}
                      className={actionButtonClasses}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openModal(emulator)}
                    >
                      Quick Edit
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(emulator.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Delete Emulator
                      </TooltipContent>
                    </Tooltip>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <EmulatorModal
          editId={editId}
          emulatorName={emulatorName}
          onClose={closeModal}
          onSuccess={() => {
            refetch().catch(console.error)
            closeModal()
          }}
        />
      )}
    </div>
  )
}

export default AdminEmulatorsPage
