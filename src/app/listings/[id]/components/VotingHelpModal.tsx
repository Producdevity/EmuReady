'use client'

import { CheckCircle, XCircle, Info } from 'lucide-react'
import { Modal, Button } from '@/components/ui'

interface Props {
  isOpen: boolean
  onClose: () => void
}

function VotingHelpModal(props: Props) {
  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="How Verification Works"
      size="lg"
    >
      <div className="space-y-6">
        {/* Introduction */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What does verification mean?
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Verification helps the community confirm whether performance
                information is accurate. Vote based on whether the reported
                experience matches reality, not personal preference.
              </p>
            </div>
          </div>
        </div>

        {/* Verification Guidelines */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Confirm (Verify) */}
          <div className="border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-green-900 dark:text-green-100">
                Confirm (Verify)
              </h4>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Vote to confirm when:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• You get similar performance results</li>
              <li>• The settings and configuration match your experience</li>
              <li>• The information is accurate and helpful</li>
              <li>• Good effort was put into the listing</li>
            </ul>
          </div>

          {/* Inaccurate */}
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h4 className="font-semibold text-red-900 dark:text-red-100">
                Inaccurate
              </h4>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Vote to &#34;Inaccurate&#34; when:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Emulator doesn&#39;t exist for this device</li>
              <li>• Your results differ significantly</li>
              <li>• The settings appear incorrect</li>
              <li>• Information seems inaccurate</li>
              <li>• Listing lacks sufficient detail</li>
            </ul>
          </div>
        </div>

        {/* Examples */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Examples
          </h4>
          <div className="space-y-3">
            {/* Good Example */}
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-green-900 dark:text-green-100 font-medium">
                    Scenario: Mario Kart on Galaxy S24 listed as &quot;Runs
                    well, 50-60 FPS&quot;
                  </p>
                  <p className="text-green-800 dark:text-green-200 mt-1">
                    <strong>Confirm</strong> if your S24 also gets 50-60 FPS,
                    even if you personally don&apos;t enjoy the game.
                  </p>
                </div>
              </div>
            </div>

            {/* Inaccurate Example */}
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-red-900 dark:text-red-100 font-medium">
                    Scenario: Same game listed as &quot;Crashes on startup&quot;
                    for a device you know can run it
                  </p>
                  <p className="text-red-800 dark:text-red-200 mt-1">
                    <strong>Inaccurate</strong> if your testing shows it
                    actually runs, indicating possible configuration issues.
                  </p>
                </div>
              </div>
            </div>

            {/* Edge Case Example */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    Scenario: Older device listed as &quot;Poor performance, but
                    playable&quot;
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    <strong>Confirm</strong> if this matches your experience
                    with that hardware, regardless of whether you think the
                    device &quot;should&quot; run it better.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Point */}
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
          <p className="text-amber-900 dark:text-amber-100 text-sm font-medium">
            💡 Remember: Vote based on accuracy and effort, not personal
            preferences or what you think &quot;should&quot; work.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={props.onClose}>Got it, thanks!</Button>
        </div>
      </div>
    </Modal>
  )
}

export default VotingHelpModal
