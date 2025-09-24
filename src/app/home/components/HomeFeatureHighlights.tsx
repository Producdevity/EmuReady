import { Shield, Users, Zap } from 'lucide-react'

export function HomeFeatureHighlights() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      <div className="group p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-center">
          Trusted Reports
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
          Real testing from real users across devices
        </p>
      </div>

      <div className="group p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-center">
          Performance Metrics
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
          Detailed compatibility and performance data
        </p>
      </div>

      <div className="group p-6 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
          <Users className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-center">
          Community Driven
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
          Preserving games where corporations won’t
        </p>
      </div>
    </div>
  )
}
