'use client'

import React, { useState } from 'react'
import EmulatorModal from '@/app/admin/emulators/components/EmulatorModal'
import Link from 'next/link'
import { api } from '@/lib/api'
import Button from '@/components/ui/Button'
import { Settings, Pencil } from 'lucide-react'

const actionButtonClasses =
  'inline-flex items-center justify-center font-medium transition-colors rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none px-3 py-1.5 text-sm border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800'

function AdminEmulatorsPage() {
  const { data: emulators, refetch } = api.emulators.list.useQuery()
  const deleteEmulator = api.emulators.delete.useMutation()

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')

  const openModal = (emulator?: { id: string; name: string }) => {
    setEditId(emulator?.id ?? null)
    setName(emulator?.name ?? '')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this emulator?')) return
    try {
      await deleteEmulator.mutateAsync({ id })
      refetch()
    } catch {
      alert('Failed to delete emulator.')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Emulators</h1>
        <Button onClick={() => openModal()}>Add Emulator</Button>
      </div>
      <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl">
          <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Name
              </th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {emulators?.map((emu: { id: string; name: string }) => (
              <tr
                key={emu.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-4 py-2">{emu.name}</td>
                <td className="px-4 py-2 flex gap-2 justify-end items-center">
                  <Link
                    href={`/admin/emulators/${emu.id}/custom-fields`}
                    className={actionButtonClasses}
                  >
                    <Settings className="mr-2 h-4 w-4" /> Custom Fields
                  </Link>
                  <Link
                    href={`/admin/emulators/${emu.id}`}
                    className={actionButtonClasses}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openModal(emu)}
                  >
                    Quick Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(emu.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <EmulatorModal
          editId={editId}
          emulatorName={name}
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
