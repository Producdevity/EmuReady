import Link from 'next/link'
import { ThemeSelect } from '@/components/ui'

function Footer() {
  return (
    <footer className=" bg-gradient-to-t from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 mt-16 text-gray-700 dark:text-gray-300">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">
              About
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://github.com/Producdevity/EmuReady/blob/master/README.md"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/Producdevity/EmuReady/issues/new?template=question.md"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Community
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://github.com/Producdevity/EmuReady/blob/master/CONTRIBUTING.md"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Contribute
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/Producdevity/EmuReady"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  GitHub
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex justify-center space-x-6 mb-2">
          <a
            href="https://github.com/Producdevity/EmuReady"
            target="_blank"
            rel="noopener"
            className="hover:text-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.67.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.36 9.36 0 0 1 12 6.84c.85.004 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.58.69.48A10.01 10.01 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
            </svg>
          </a>
        </div>
        <div className="flex justify-center items-center my-4">
          <ThemeSelect />
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} EmuReady. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer
