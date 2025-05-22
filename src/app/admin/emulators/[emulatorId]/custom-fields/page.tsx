'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import { PlusCircle } from 'lucide-react';
import CustomFieldList from './components/CustomFieldList';
import CustomFieldFormModal from './components/CustomFieldFormModal';

export default function EmulatorCustomFieldsPage() {
  const params = useParams();
  const emulatorId = params.emulatorId as string;

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  const { data: emulator, isLoading: isLoadingEmulator, error: emulatorError } = api.emulators.byId.useQuery(
    { id: emulatorId }, 
    { enabled: !!emulatorId }
  );

  const {
    data: customFields,
    isLoading: isLoadingCustomFields,
    error: customFieldsError,
    refetch: refetchCustomFields,
  } = api.customFieldDefinitions.listByEmulator.useQuery(
    { emulatorId },
    { enabled: !!emulatorId }
  );

  const handleOpenCreateModal = () => {
    setEditingFieldId(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (fieldId: string) => {
    setEditingFieldId(fieldId);
    setIsFormModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setEditingFieldId(null);
    refetchCustomFields(); // Refetch when modal closes to see updates
  };

  if (isLoadingEmulator || isLoadingCustomFields) {
    return <div>Loading...</div>;
  }

  if (emulatorError) {
    return <div>Error loading emulator: {emulatorError.message}</div>;
  }

  if (customFieldsError) {
    return <div>Error loading custom fields: {customFieldsError.message}</div>;
  }

  if (!emulator) {
    return <div>Emulator not found.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Custom Fields for {emulator.name}
        </h1>
        <Button onClick={handleOpenCreateModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Field
        </Button>
      </div>

      {customFields && customFields.length > 0 ? (
        <CustomFieldList 
          customFields={customFields}
          onEdit={handleOpenEditModal}
          onDeleteSuccess={refetchCustomFields} 
          emulatorId={emulatorId}
        />
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No custom fields defined for this emulator yet.</p>
      )}

      {isFormModalOpen && (
        <CustomFieldFormModal
          emulatorId={emulatorId}
          fieldIdToEdit={editingFieldId}
          isOpen={isFormModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
} 