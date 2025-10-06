import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { type LucideIcon, CircleUser, UserRoundPlus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'

interface Props {
  icon: LucideIcon
  title: string
  subtitle: string
  description: string
  showSignUp?: boolean
  signUpPrompt?: string
}

export default function UnauthenticatedPage(props: Props) {
  return (
    <div className="relative flex items-center justify-center min-h-[60vh] dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 overflow-hidden mb-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* Main content card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:shadow-3xl">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4 animate-pulse-slow">
              <props.icon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              {props.title}
              <Sparkles className="w-5 h-5" />
            </h1>
            <p className="text-blue-100">{props.subtitle}</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <p className="text-center text-gray-600 dark:text-gray-300 mb-8">{props.description}</p>

            {/* Sign In Button */}
            <div className="flex justify-center">
              <SignInButton mode="modal">
                <Button variant="fancy" icon={CircleUser} className="w-full">
                  Sign In
                </Button>
              </SignInButton>
            </div>

            {/* Sign Up Section - Optional */}
            {props.showSignUp && (
              <>
                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400">
                      New to EmuReady?
                    </span>
                  </div>
                </div>

                {/* Sign Up Section */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {props.signUpPrompt || 'Create an account to get started'}
                  </p>
                  <div className="flex justify-center">
                    <SignUpButton mode="modal">
                      <Button icon={UserRoundPlus} className="w-full">
                        Sign Up
                      </Button>
                    </SignUpButton>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer decoration */}
          <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        </div>
      </div>
    </div>
  )
}
