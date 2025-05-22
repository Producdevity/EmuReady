'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { type CustomFieldDefinition, CustomFieldType, type Prisma } from '@orm';
import Button from '@/components/ui/Button';
import { Pencil, Trash2, GripVertical, X } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CustomFieldOptionUI {
  value: string;
  label: string;
}

interface CustomFieldListProps {
  customFields: CustomFieldDefinition[];
  onEdit: (fieldId: string) => void;
  onDeleteSuccess: () => void;
  emulatorId: string;
}

type SortableCustomField = CustomFieldDefinition;

function SortableRow({ field, onEdit, handleDelete, isReorderMode, renderOptionsPreview }: {
  field: SortableCustomField;
  onEdit: (fieldId: string) => void;
  handleDelete: (fieldId: string) => void;
  isReorderMode: boolean;
  renderOptionsPreview: (optionsAsJson: Prisma.JsonValue | null | undefined) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const,
  };

  return (
    <React.Fragment>
      <tr ref={setNodeRef} style={style} {...(isReorderMode ? attributes : {})} {...(isReorderMode ? listeners : {})}>
        {isReorderMode && (
          <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 cursor-grab">
            <GripVertical className="h-5 w-5" />
          </td>
        )}
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{field.label}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{field.name}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          <Badge variant={field.type === CustomFieldType.SELECT ? 'primary' : 'default'}>{field.type}</Badge>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {field.isRequired ? <Badge variant="success">Yes</Badge> : <Badge variant="default">No</Badge>}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          {field.type === CustomFieldType.SELECT ? renderOptionsPreview(field.options) : <span className="text-gray-500 italic">N/A</span>}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{field.displayOrder}</td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
          {!isReorderMode && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onEdit(field.id)} aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(field.id)} aria-label="Delete" className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </td>
      </tr>
    </React.Fragment>
  );
}

export default function CustomFieldList({
  customFields: initialCustomFields,
  onEdit,
  onDeleteSuccess,
  emulatorId
}: CustomFieldListProps) {
  const utils = api.useUtils();
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [orderedFields, setOrderedFields] = useState<SortableCustomField[]>(() => 
    [...initialCustomFields].sort((a, b) => a.displayOrder - b.displayOrder)
  );

  useEffect(() => {
    // Keep local state in sync if initialCustomFields prop changes and not in reorder mode
    if (!isReorderMode) {
        setOrderedFields([...initialCustomFields].sort((a, b) => a.displayOrder - b.displayOrder));
    }
  }, [initialCustomFields, isReorderMode]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateOrderMutation = api.customFieldDefinitions.updateOrder.useMutation({
    onSuccess: () => {
      utils.customFieldDefinitions.listByEmulator.invalidate({ emulatorId });
      // Optionally show success notification
      alert('Order updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating order:', error);
      alert(`Error updating order: ${error.message}`);
      // Revert to original order from prop on error if optimistic update was more complex
      setOrderedFields([...initialCustomFields].sort((a, b) => a.displayOrder - b.displayOrder));
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setOrderedFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over!.id); // over.id should exist here
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update displayOrder based on new array index for persistence
        const payload = newItems.map((item, index) => ({ id: item.id, displayOrder: index }));
        // Call mutation immediately or defer to a "Save Order" button
        // For simplicity, calling immediately, but this can be chatty.
        updateOrderMutation.mutate(payload);
        return newItems;
      });
    }
  };

  const deleteMutation = api.customFieldDefinitions.delete.useMutation({
    onSuccess: () => {
      utils.customFieldDefinitions.listByEmulator.invalidate({ emulatorId });
      onDeleteSuccess();
    },
    onError: (error) => {
      console.error('Error deleting custom field:', error);
      alert(`Error: ${error.message}`);
    },
  });

  const handleDelete = (fieldId: string) => {
    if (window.confirm('Are you sure you want to delete this custom field?')) {
      deleteMutation.mutate({ id: fieldId });
    }
  };

  const renderOptionsPreview = (optionsAsJson: Prisma.JsonValue | null | undefined): React.ReactNode => {
    if (!Array.isArray(optionsAsJson)) {
      return <span className="text-gray-500 italic">N/A</span>;
    }

    const validOptions: CustomFieldOptionUI[] = [];
    for (const item of optionsAsJson) {
      if (typeof item === 'object' && item !== null && 'value' in item && 'label' in item) {
        const val = (item as { value?: unknown }).value;
        const lbl = (item as { label?: unknown }).label;
        if (typeof val === 'string' && typeof lbl === 'string') {
          validOptions.push({ value: val, label: lbl });
        }
      }
    }

    if (validOptions.length === 0) {
      return <span className="text-gray-500 italic">N/A</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {validOptions.slice(0, 3).map((opt, index) => (
          <Badge key={index} variant="default">
            {opt.label ?? opt.value ?? 'Invalid Option'}
          </Badge>
        ))}
        {validOptions.length > 3 && <Badge variant="default">+ {validOptions.length - 3} more</Badge>}
      </div>
    );
  };

  if (!initialCustomFields || initialCustomFields.length === 0) {
    return <p>No custom fields defined for this emulator yet.</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={() => setIsReorderMode(!isReorderMode)}>
          {isReorderMode ? <><X className="mr-2 h-4 w-4"/> Cancel Reorder</> : <><GripVertical className="mr-2 h-4 w-4" /> Reorder Fields</>}
        </Button>
      </div>
      <SortableContext items={orderedFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {isReorderMode && <th scope="col" className="px-2 py-3"></th>}
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
              {orderedFields.map((field) => (
                <SortableRow 
                  key={field.id} 
                  field={field} 
                  onEdit={onEdit} 
                  handleDelete={handleDelete} 
                  isReorderMode={isReorderMode}
                  renderOptionsPreview={renderOptionsPreview}
                />
              ))}
            </tbody>
          </table>
        </div>
      </SortableContext>
    </DndContext>
  );
} 