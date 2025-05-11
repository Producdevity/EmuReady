"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function AddGamePage() {
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [systemId, setSystemId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch systems for dropdown
  const { data: systems, isLoading: systemsLoading } = api.systems.list.useQuery();
  const createGame = api.games.create.useMutation();

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (status === "loading") return <div>Loading...</div>;
  if (!session || (session.user.role !== "AUTHOR" && session.user.role !== "ADMIN")) {
    return <div className="p-8 text-center">You do not have permission to add games.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!title || !systemId) {
      setError("Please fill in all fields.");
      return;
    }
    try {
      await createGame.mutateAsync({ title, systemId });
      setSuccess("Game added!");
      setTitle("");
      setSystemId("");
      // Optionally redirect or refetch listings
      // router.push("/listings");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to add game.");
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Add New Game</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Title</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">System</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"
            value={systemId}
            onChange={e => setSystemId(e.target.value)}
            required
            disabled={systemsLoading}
          >
            <option value="">Select system...</option>
            {systems?.map((sys: { id: string; name: string }) => (
              <option key={sys.id} value={sys.id}>{sys.name}</option>
            ))}
          </select>
        </div>
        {error && <div className="text-red-500 fixed top-4 right-4 bg-white dark:bg-gray-800 border border-red-400 px-4 py-2 rounded shadow z-50">{error}</div>}
        {success && <div className="text-green-600 fixed top-4 right-4 bg-white dark:bg-gray-800 border border-green-400 px-4 py-2 rounded shadow z-50">{success}</div>}
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
          disabled={createGame.isPending}
        >
          {createGame.isPending ? "Adding..." : "Add Game"}
        </button>
      </form>
    </div>
  );
} 