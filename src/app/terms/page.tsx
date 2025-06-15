import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | EmuReady',
  description:
    'Review the terms and conditions for using EmuReady platform and services.',
  robots: 'index, follow',
}

const emureadyEmail = process.env.NEXT_PUBLIC_EMUREADY_EMAIL || ''
const githubIssuesUrl = `${process.env.NEXT_PUBLIC_GITHUB_URL}/issues`

function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Terms of Service
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          <strong>Last updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              By accessing and using EmuReady (&ldquo;the Service&rdquo;), you
              accept and agree to be bound by the terms and provision of this
              agreement. If you do not agree to abide by the above, please do
              not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Description of Service
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              EmuReady is a community-driven platform that allows users to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Share and view emulation compatibility reports</li>
              <li>Rate and comment on gaming experiences</li>
              <li>Browse games, emulators, and device information</li>
              <li>Create and manage user profiles</li>
              <li>Participate in community discussions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. User Accounts
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              To access certain features of the Service, you must create an
              account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                Provide accurate, current, and complete information during
                registration
              </li>
              <li>Maintain and promptly update your account information</li>
              <li>
                Maintain the security of your password and accept responsibility
                for all activities under your account
              </li>
              <li>
                Notify us immediately of any unauthorized use of your account
              </li>
              <li>
                Not create multiple accounts or share your account with others
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. Acceptable Use Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You agree to use EmuReady responsibly and not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Post false, misleading, or malicious content</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Share copyrighted material without permission</li>
              <li>Promote piracy or illegal activities</li>
              <li>Spam or flood the platform with repetitive content</li>
              <li>Attempt to hack, disrupt, or compromise the Service</li>
              <li>Create fake accounts or manipulate ratings/reviews</li>
              <li>
                Use the Service for commercial purposes without authorization
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Contact Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              If you have any questions about these Terms of Service, please
              contact us:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mt-4">
              <li>
                <strong>GitHub Issues:</strong>{' '}
                <a
                  href={githubIssuesUrl}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {githubIssuesUrl}
                </a>
              </li>
              <li>
                <strong>Email:</strong>{' '}
                <a
                  href={`mailto:${emureadyEmail}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {emureadyEmail}
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

export default TermsOfServicePage
