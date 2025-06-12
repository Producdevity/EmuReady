import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { Button } from '@/components/ui'

function NotSignedInMessage() {
  return (
    <div className="flex flex-col items-center justify-start h-screen space-y-4 mt-4 md:mt-20">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Please Sign In to Add a Game
      </h1>
      <div className="flex space-x-4">
        <SignInButton mode="modal">
          <Button variant="default">Sign In</Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button variant="fancy">Sign Up</Button>
        </SignUpButton>
      </div>
      <p className="text-gray-600 dark:text-gray-400">
        You need to be logged in to add games to the library.
      </p>
    </div>
  )
}

export default NotSignedInMessage
