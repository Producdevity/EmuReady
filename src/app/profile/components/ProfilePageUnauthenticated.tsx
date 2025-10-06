import { Lock } from 'lucide-react'
import UnauthenticatedPage from '@/components/auth/UnauthenticatedPage'

function ProfilePageUnauthenticated() {
  return (
    <UnauthenticatedPage
      icon={Lock}
      title="Welcome Back"
      subtitle="Sign in to access your profile"
      description="You need to be logged in to access this page and explore all features."
      showSignUp={true}
      signUpPrompt="Create an account to get started"
    />
  )
}

export default ProfilePageUnauthenticated
