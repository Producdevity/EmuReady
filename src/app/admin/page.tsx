import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome, Admin!</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
        Manage all systems, devices, emulators, performance scales, and approve new listings from this dashboard.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/systems" className="block bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-indigo-600 dark:text-indigo-400">Systems</h2>
          <p className="text-gray-600 dark:text-gray-300">Manage game systems and platforms.</p>
        </Link>
        <Link href="/admin/devices" className="block bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-indigo-600 dark:text-indigo-400">Devices</h2>
          <p className="text-gray-600 dark:text-gray-300">Manage Android devices.</p>
        </Link>
        <Link href="/admin/emulators" className="block bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-indigo-600 dark:text-indigo-400">Emulators</h2>
          <p className="text-gray-600 dark:text-gray-300">Manage emulators.</p>
        </Link>
        <Link href="/admin/performance" className="block bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-indigo-600 dark:text-indigo-400">Performance Scales</h2>
          <p className="text-gray-600 dark:text-gray-300">Manage performance scale labels and ranks.</p>
        </Link>
        <Link href="/admin/listings" className="block bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-indigo-600 dark:text-indigo-400">Listing Approvals</h2>
          <p className="text-gray-600 dark:text-gray-300">Approve, reject, or edit new listings.</p>
        </Link>
      </div>
    </div>
  );
} 