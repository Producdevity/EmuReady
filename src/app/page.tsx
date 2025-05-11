"use client";

// import { FormEvent, useState } from "react";
// import { useRouter } from "next/navigation";
// import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function Home() {
  // const router = useRouter();
  // const [searchQuery, setSearchQuery] = useState("");

  // const handleSearch = (ev: FormEvent) => {
  //   ev.preventDefault();
  //   if (searchQuery.trim()) {
  //     router.push(`/listings?search=${encodeURIComponent(searchQuery.trim())}`);
  //   }
  // };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="py-16 mb-16 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-xl shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/30 via-blue-400/10 to-transparent pointer-events-none" />
          <div className="text-center relative z-10">
            <h1 className="text-5xl md:text-6xl font-extrabold text-white dark:text-indigo-100 mb-6 drop-shadow-lg tracking-tight">Know before you load</h1>
            <p className="text-2xl md:text-3xl text-indigo-100 dark:text-indigo-200 mb-10 max-w-3xl mx-auto font-medium">Find the perfect emulator for your Android device. Community-driven compatibility reports that help you make informed decisions.</p>
            <div className="flex justify-center space-x-6">
              <Link href="/listings" className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 transform hover:scale-105">
                Browse Compatibility Reports
              </Link>
              <Link href="/register" className="bg-white/90 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-700 dark:text-indigo-200 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 transform hover:scale-105">
                Join the Community
              </Link>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">2,500+</div>
              <div className="text-gray-600 dark:text-gray-300">Compatibility Reports</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">150+</div>
              <div className="text-gray-600 dark:text-gray-300">Supported Games</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">10+</div>
              <div className="text-gray-600 dark:text-gray-300">Emulators</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">25+</div>
              <div className="text-gray-600 dark:text-gray-300">Android Devices</div>
            </div>
          </div>
        </section>

        {/* Featured Content */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Featured Compatible Games
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
              <img
                src="https://placehold.co/400x200"
                alt="The Legend of Zelda: Breath of the Wild"
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    The Legend of Zelda: BotW
                  </h3>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
                    Perfect
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>Nintendo Switch</span>
                  <span>Yuzu Emulator</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{ width: '95%' }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">95%</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
              <img
                src="https://placehold.co/400x200"
                alt="Animal Crossing: New Horizons"
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Animal Crossing: New Horizons
                  </h3>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
                    Perfect
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>Nintendo Switch</span>
                  <span>Yuzu Emulator</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">100%</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
              <img
                src="https://placehold.co/400x200"
                alt="God of War: Ragnarök"
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    God of War: Ragnarök
                  </h3>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300">
                    Playable
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>PlayStation 5</span>
                  <span>Sudachi Emulator</span>
                </div>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-yellow-500 h-2.5 rounded-full"
                      style={{ width: '68%' }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">68%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-600 text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Help Build the Community</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Submit your own compatibility reports and help others find the best gaming experience on
            their Android devices.
          </p>
          <Link
            href="/register"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all inline-block"
          >
            Create an Account
          </Link>
        </section>
      </div>
    </div>
  );
}
