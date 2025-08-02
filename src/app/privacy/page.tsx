import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | EmuReady',
  description:
    'Learn how EmuReady collects, uses, and protects your personal information.',
  robots: 'index, follow',
}

const emureadyEmail = process.env.NEXT_PUBLIC_EMUREADY_EMAIL || ''
const githubIssuesUrl = `${process.env.NEXT_PUBLIC_GITHUB_URL}/issues`

function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Privacy Policy
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          <strong>Last updated:</strong> January 2, 2025
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Welcome to EmuReady (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
              &ldquo;us&rdquo;). This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you visit our
              website and use our services. EmuReady is a community-driven
              platform for sharing emulation compatibility reports and gaming
              experiences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Information We Collect
            </h2>

            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
              2.1 Information You Provide
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Account Information:</strong> Username, email address,
                and profile information when you create an account
              </li>
              <li>
                <strong>Content:</strong> Emulation reports, comments, ratings,
                and other content you submit
              </li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3 mt-6">
              2.2 Information Automatically Collected
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Usage Data:</strong> How you interact with our website
                and services
              </li>
              <li>
                <strong>Device Information:</strong> IP address, browser type,
                device type, and operating system
              </li>
              <li>
                <strong>Cookies:</strong> Small data files stored on your device
                to enhance your experience
              </li>
              <li>
                <strong>Analytics:</strong> Anonymous usage statistics to
                improve our services
              </li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3 mt-6">
              2.3 Mobile App Information
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Device Identifiers:</strong> For analytics and crash
                reporting
              </li>
              <li>
                <strong>App Information:</strong> App version, build number, and
                performance data
              </li>
              <li>
                <strong>Operating System:</strong> Version and device
                model/manufacturer
              </li>
              <li>
                <strong>Crash Logs:</strong> Technical data to help us fix app
                issues
              </li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3 mt-6">
              2.4 Device Permissions (Mobile App)
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
              Our mobile app may request the following permissions:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Storage:</strong> To save app preferences and cache data
                for offline access
              </li>
              <li>
                <strong>Network:</strong> To communicate with our servers and
                sync your data
              </li>
              <li>
                <strong>Push Notifications:</strong> To send you updates about
                your reports and community activity (opt-in)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Provide and maintain our services</li>
              <li>Authenticate users</li>
              <li>Enable community features like comments and ratings</li>
              <li>Send important service updates and notifications (opt-in)</li>
              <li>
                Send push notifications about new reports, updates, and
                community activity (mobile app, opt-in)
              </li>
              <li>Improve our platform through analytics and user feedback</li>
              <li>Ensure compliance with our Terms of Service</li>
              <li>Respond to support requests and user inquiries</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. Information Sharing
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We do not sell, rent, or trade your personal information. We may
              share information in these limited circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Public Content:</strong> User-generated content like
                reviews and comments are publicly visible
              </li>
              <li>
                <strong>Service Providers:</strong> Third-party services that
                help us operate our platform (authentication, analytics,
                hosting)
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to
                protect our rights and safety
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with mergers,
                acquisitions, or asset transfers
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Third-Party Services
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              EmuReady integrates with several third-party services:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Clerk:</strong> User authentication and account
                management
              </li>
              <li>
                <strong>Vercel:</strong> Website hosting and analytics
              </li>
              <li>
                <strong>Supabase:</strong> Database and storage services
              </li>
              <li>
                <strong>Google Analytics:</strong> Anonymous usage analytics (if
                enabled)
              </li>
              <li>
                <strong>TheGamesDB & RAWG:</strong> Game information and
                metadata
              </li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              These services have their own privacy policies, and we encourage
              you to review them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Data Security
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We implement appropriate security measures to protect your
              information, including: encryption in transit and at rest, secure
              authentication systems, regular security audits, and limited
              access controls. However, no internet-based service is 100%
              secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. Your Rights and Choices
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You have the following rights regarding your information:
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              <strong>Note:</strong> Account creation is required to submit
              emulation reports and participate in community features. You can
              browse public content without an account.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Access:</strong> Request access to your personal
                information
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate
                information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and
                associated data
              </li>
              <li>
                <strong>Portability:</strong> Export your data in a common
                format
              </li>
              <li>
                <strong>Opt-out:</strong> Unsubscribe from promotional
                communications
              </li>
              <li>
                <strong>Cookie Control:</strong> Manage cookie preferences in
                your browser
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              EmuReady is not intended for children under 13 years of age. We do
              not knowingly collect personal information from children under 13.
              If you believe we have collected information from a child under
              13, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              9. International Users
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              EmuReady is hosted in the United States. If you are accessing our
              services from outside the United States, please be aware that your
              information may be transferred to, stored, and processed in the
              United States where our servers are located.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new policy on
              this page and updating the &ldquo;Last updated&rdquo; date.
              Continued use of our services after changes become effective
              constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              11. Data Retention
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We retain your personal information for as long as necessary to
              provide our services and comply with legal obligations. Account
              data is retained while your account is active. You can request
              deletion of your account and associated data at any time through
              your account settings or by contacting us. Some information may be
              retained in anonymized form for analytics purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              12. Platform Compliance
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              This app complies with the Google Play Store and Apple App Store
              privacy requirements and guidelines. We are committed to
              maintaining transparency about our data practices and ensuring
              compliance with all applicable platform policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              13. Contact Us
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              If you have questions about this Privacy Policy or our data
              practices, please contact us:
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

export default PrivacyPolicyPage
