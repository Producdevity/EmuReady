"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button, Input } from "@/components/ui";

export default function AdminDevicesPage() {
  const { data: devices, refetch } = api.devices.list.useQuery();
  const createDevice = api.devices.create.useMutation();
  const updateDevice = api.devices.update.useMutation();
  const deleteDevice = api.devices.delete.useMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [brand, setBrand] = useState("");
  const [modelName, setModelName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const openModal = (device?: { id: string; brand: string; modelName: string }) => {
    setEditId(device?.id || null);
    setBrand(device?.brand || "");
    setModelName(device?.modelName || "");
    setModalOpen(true);
    setError("");
    setSuccess("");
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
    setBrand("");
    setModelName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      if (editId) {
        await updateDevice.mutateAsync({ id: editId, brand, modelName });
        setSuccess("Device updated!");
      } else {
        await createDevice.mutateAsync({ brand, modelName });
        setSuccess("Device created!");
      }
      refetch();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save device.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this device?")) return;
    try {
      await deleteDevice.mutateAsync({ id });
      refetch();
    } catch {
      alert("Failed to delete device.");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Devices</h1>
        <Button onClick={() => openModal()}>Add Device</Button>
      </div>
      <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl">
          <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Brand</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Model</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {devices?.map((dev: { id: string; brand: string; modelName: string }) => (
              <tr key={dev.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-2">{dev.brand}</td>
                <td className="px-4 py-2">{dev.modelName}</td>
                <td className="px-4 py-2 flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => openModal(dev)}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDelete(dev.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-all">
          <form className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 relative" onSubmit={handleSubmit}>
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900 dark:text-white tracking-tight">{editId ? "Edit Device" : "Add Device"}</h2>
            <label className="block mb-2 font-medium">Brand</label>
            <Input value={brand} onChange={e => setBrand(e.target.value)} required className="mb-4 w-full" />
            <label className="block mb-2 font-medium">Model Name</label>
            <Input value={modelName} onChange={e => setModelName(e.target.value)} required className="mb-4 w-full" />
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {success && <div className="text-green-600 mb-2">{success}</div>}
            <div className="flex gap-2 justify-end mt-6">
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button type="submit" isLoading={createDevice.isPending || updateDevice.isPending} className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105">{editId ? "Save" : "Create"}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 