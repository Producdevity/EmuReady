'use client';

import React from 'react';
import { api } from '@/lib/api';
import { type CustomFieldDefinition, CustomFieldType, type Prisma } from '@orm';
import Button from '@/components/ui/Button';
import { Pencil, Trash2 } from 'lucide-react';
import Badge from '@/components/ui/Badge';

interface CustomFieldOptionUI {
  value: string;
  label: string;
}

// A more specific type that represents what we expect an element of the options array to be
// after confirming it is a JsonObject and has our fields.
// This combines Prisma.JsonObject with our specific fields for stricter checking.
type ValidOptionObject = Prisma.JsonObject & CustomFieldOptionUI;

interface CustomFieldListProps {
  customFields: CustomFieldDefinition[];
  onEdit: (fieldId: string) => void;
  onDeleteSuccess: () => void;
  emulatorId: string; // For optimistic updates or cache invalidation context
}

export default function CustomFieldList({
  customFields,
  onEdit,
  onDeleteSuccess,
  emulatorId
}: CustomFieldListProps) {
  const utils = api.useUtils();

  const deleteMutation = api.customFieldDefinitions.delete.useMutation({
    onSuccess: () => {
      // Invalidate the list query to refetch
      utils.customFieldDefinitions.listByEmulator.invalidate({ emulatorId });
      onDeleteSuccess(); // Callback for any additional actions like notifications
    },
    onError: (error) => {
      console.error('Error deleting custom field:', error);
      alert(`Error: ${error.message}`); // Simple error handling
    },
  });

  const handleDelete = (fieldId: string) => {
    if (window.confirm('Are you sure you want to delete this custom field?')) {
      deleteMutation.mutate({ id: fieldId });
    }
  };

  const renderOptionsPreview = (optionsAsJson: Prisma.JsonValue | null | undefined) => {
    const isOptionObject = (item: Prisma.JsonValue): item is ValidOptionObject => {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        return false; // Not a JsonObject
      }
      // Now item is Prisma.JsonObject. Check for our specific fields.
      const obj = item as Prisma.JsonObject;
      return typeof obj.value === 'string' && typeof obj.label === 'string';
    };

    // Type guard for the array itself
    const isOptionsArray = (
      arr: Prisma.JsonValue | null | undefined
    ): arr is ValidOptionObject[] => {
      return Array.isArray(arr) && arr.every(isOptionObject);
    };

    if (isOptionsArray(optionsAsJson) && optionsAsJson.length > 0) {
      // optionsAsJson is now ValidOptionObject[]
      return (
        <div className="flex flex-wrap gap-1">
          {optionsAsJson.slice(0, 3).map((opt, index) => (
            <Badge key={index} variant="default">
              {opt.label ?? opt.value ?? 'Invalid Option'}
            </Badge>
          ))}
          {optionsAsJson.length > 3 && <Badge variant="default">+ {optionsAsJson.length - 3} more</Badge>}
        </div>
      );
    }
    return <span className="text-gray-500 italic">N/A</span>;
  };

  if (!customFields || customFields.length === 0) {
    return <p>No custom fields defined for this emulator yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Display Label</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Internal Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Required</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Options (Preview)</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {customFields.map((field) => (
            <tr key={field.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{field.label}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{field.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <Badge variant={field.type === CustomFieldType.SELECT ? 'primary' : 'default'}>{field.type}</Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {field.isRequired ? (
                    <Badge variant="success">Yes</Badge>
                ) : (
                    <Badge variant="default">No</Badge>
                )}
                </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {field.type === CustomFieldType.SELECT ? renderOptionsPreview(field.options) : <span className="text-gray-500 italic">N/A</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{field.displayOrder}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(field.id)} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(field.id)} aria-label="Delete" className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 