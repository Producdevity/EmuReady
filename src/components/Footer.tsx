import { ThemeSelect } from '@/components/ui'
import GitHubIcon from '@/components/icons/GitHubIcon'

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
                <a
                  href="https://github.com/Producdevity/EmuReady/blob/master/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="EmuReady Documentation"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Producdevity/EmuReady/issues/new?template=question.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="EmuReady Support"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Community
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/Producdevity/EmuReady/blob/master/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contribute to EmuReady"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Contribute
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Producdevity/EmuReady/issues/new?template=emulator_request.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Add your Emulator"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Add Your Emulator
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Producdevity/EmuReady"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="EmuReady GitHub"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex justify-center space-x-6 mb-2">
          <a
            href="https://github.com/Producdevity/EmuReady"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="EmuReady GitHub"
            className="hover:text-gray-100 transition-colors"
          >
            <GitHubIcon />
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
