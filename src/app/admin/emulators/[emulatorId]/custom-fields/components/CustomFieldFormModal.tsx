'use client';

import React, { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { CustomFieldType } from '@orm';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SelectInput from '@/components/ui/SelectInput';
import { PlusCircle, Trash2 } from 'lucide-react';

const customFieldOptionSchema = z.object({
  value: z.string().min(1, 'Value is required'),
  label: z.string().min(1, 'Label is required'),
});

const customFieldFormSchema = z.object({
  name: z.string().min(1, 'Internal Name is required').regex(/^[a-z0-9_]+$/, {
    message: 'Name must be lowercase alphanumeric with underscores only.',
  }),
  label: z.string().min(1, 'Label is required'),
  type: z.nativeEnum(CustomFieldType),
  options: z.array(customFieldOptionSchema).optional(),
  isRequired: z.boolean().optional(),
  displayOrder: z.coerce.number().int().optional(),
});

type CustomFieldFormValues = z.infer<typeof customFieldFormSchema>;

type CustomFieldUpdatePayload = {
  id: string;
  name?: string;
  label?: string;
  type?: CustomFieldType;
  options?: { value: string; label: string }[] | undefined;
  isRequired?: boolean;
  displayOrder?: number;
};

type CustomFieldCreatePayload = {
  emulatorId: string;
  name: string;
  label: string;
  type: CustomFieldType;
  options?: { value: string; label: string }[] | undefined;
  isRequired: boolean;
  displayOrder: number;
};

interface CustomFieldFormModalProps {
  emulatorId: string;
  fieldIdToEdit?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomFieldFormModal({
  emulatorId,
  fieldIdToEdit,
  isOpen,
  onClose,
}: CustomFieldFormModalProps) {
  const utils = api.useUtils();

  const { data: fieldToEditData, isLoading: isLoadingFieldToEdit } = api.customFieldDefinitions.byId.useQuery(
    { id: fieldIdToEdit! }, 
    { enabled: !!fieldIdToEdit }
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CustomFieldFormValues>({
    resolver: zodResolver(customFieldFormSchema),
    defaultValues: {
      name: '',
      label: '',
      type: CustomFieldType.TEXT,
      options: [],
      isRequired: false,
      displayOrder: 0,
    },
  });

  const selectedFieldType = watch('type');
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  useEffect(() => {
    if (fieldToEditData) {
      const opts = Array.isArray(fieldToEditData.options) ? fieldToEditData.options as {value: string, label: string}[] : [];
      reset({
        name: fieldToEditData.name,
        label: fieldToEditData.label,
        type: fieldToEditData.type,
        options: opts,
        isRequired: fieldToEditData.isRequired,
        displayOrder: fieldToEditData.displayOrder,
      });
    } else if (!fieldIdToEdit) {
      reset({
        name: '',
        label: '',
        type: CustomFieldType.TEXT,
        options: [],
        isRequired: false,
        displayOrder: 0,
      });
    }
  }, [fieldToEditData, fieldIdToEdit, reset]);

  const createMutation = api.customFieldDefinitions.create.useMutation({
    onSuccess: () => {
      utils.customFieldDefinitions.listByEmulator.invalidate({ emulatorId });
      onClose();
    },
    onError: (error) => {
      console.error('Error creating custom field:', error);
      alert(`Error: ${error.message}`);
    },
  });

  const updateMutation = api.customFieldDefinitions.update.useMutation({
    onSuccess: () => {
      utils.customFieldDefinitions.listByEmulator.invalidate({ emulatorId });
      utils.customFieldDefinitions.byId.invalidate({ id: fieldIdToEdit! });
      onClose();
    },
    onError: (error) => {
      console.error('Error updating custom field:', error);
      alert(`Error: ${error.message}`);
    },
  });

  const onSubmit = (data: CustomFieldFormValues) => {
    const basePayload = {
      name: data.name,
      label: data.label,
      type: data.type,
      isRequired: data.isRequired ?? false,
      displayOrder: data.displayOrder ?? 0,
      options: undefined as ({ value: string; label: string }[] | undefined),
    };

    if (data.type === CustomFieldType.SELECT) {
      if (data.options && data.options.length > 0) {
        basePayload.options = data.options;
      } else {
        alert("Options are required for SELECT type fields and cannot be empty.");
        return;
      }
    }

    if (fieldIdToEdit) {
      const updatePayload: CustomFieldUpdatePayload = {
        id: fieldIdToEdit,
        name: basePayload.name,
        label: basePayload.label,
        type: basePayload.type,
        isRequired: basePayload.isRequired,
        displayOrder: basePayload.displayOrder,
        options: basePayload.options,
      };
      updateMutation.mutate(updatePayload);
    } else {
      const createPayload: CustomFieldCreatePayload = {
        emulatorId,
        name: basePayload.name,
        label: basePayload.label,
        type: basePayload.type,
        isRequired: basePayload.isRequired,
        displayOrder: basePayload.displayOrder,
        options: basePayload.options,
      };
      createMutation.mutate(createPayload);
    }
  };

  if (!isOpen) return null;
  if (fieldIdToEdit && isLoadingFieldToEdit) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><p>Loading field data...</p></div>;

  const typeOptions = Object.values(CustomFieldType).map((type) => ({ value: type, label: type }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-4">
          {fieldIdToEdit ? 'Edit' : 'Create'} Custom Field
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="label" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Label</label>
            <Input id="label" {...register('label')} placeholder="e.g., Driver Version" className="mt-1" />
            {errors.label && <p className="text-red-500 text-xs mt-1">{errors.label.message}</p>}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Internal Name (lowercase,_)</label>
            <Input id="name" {...register('name')} placeholder="e.g., driver_version" className="mt-1" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Field Type</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <SelectInput 
                    label="Field Type"
                    options={typeOptions.map(opt => ({ id: opt.value, name: opt.label }))} 
                    value={field.value} 
                    onChange={(e) => field.onChange(e.target.value as CustomFieldType)}
                />
              )}
            />
            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
          </div>

          {selectedFieldType === CustomFieldType.SELECT && (
            <div className="space-y-3 p-3 border rounded-md dark:border-gray-700">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">Dropdown Options</h3>
              {fields.map((item, index) => (
                <div key={item.id} className="flex items-center space-x-2 p-2 border-b dark:border-gray-600">
                  <Input
                    {...register(`options.${index}.value`)}
                    placeholder="Value (e.g., v1.0)"
                    className="flex-1"
                  />
                  <Input
                    {...register(`options.${index}.label`)}
                    placeholder="Label (e.g., Version 1.0)"
                    className="flex-1"
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} aria-label="Remove option">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              {errors.options?.message && <p className="text-red-500 text-xs mt-1">{errors.options.message}</p>}
              {Array.isArray(errors.options) && errors.options.map((optError, index) => (
                <div key={index} className="text-red-500 text-xs">
                    {optError?.value && <p>{`Option ${index+1} Value: ${optError.value.message}`}</p>}
                    {optError?.label && <p>{`Option ${index+1} Label: ${optError.label.message}`}</p>}
                </div>
              ))}
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({ value: '', label: '' })}
                className="mt-2"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Option
              </Button>
            </div>
          )}

          <div className="flex items-center">
            <Controller
                name="isRequired"
                control={control}
                render={({ field }) => (
                    <input 
                        id="isRequired" 
                        type="checkbox" 
                        checked={field.value ?? false} 
                        onChange={(e) => field.onChange(e.target.checked)} 
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
                    />
                )}
            />
            <label htmlFor="isRequired" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">Is Required?</label>
            {errors.isRequired && <p className="text-red-500 text-xs mt-1">{errors.isRequired.message}</p>}
          </div>

           <div>
            <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Order</label>
            <Input id="displayOrder" type="number" {...register('displayOrder')} className="mt-1" />
            {errors.displayOrder && <p className="text-red-500 text-xs mt-1">{errors.displayOrder.message}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
              {fieldIdToEdit ? 'Update' : 'Create'} Field
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 