import { SignUp } from '@clerk/nextjs'
import { SignupStartTracker } from '@/components/analytics/signup-start-tracker'

export const metadata = {
  title: 'Sign Up — SerpAlert',
  description: 'Create your SerpAlert account to start monitoring competitor ad activity.',
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <SignupStartTracker />
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-6 text-center">Sign Up</h1>
        <SignUp fallbackRedirectUrl="/dashboard" />
        <p className="text-xs text-gray-400 text-center mt-4">
          By signing up, you agree to our{' '}
          <a href="/terms" className="text-indigo-600 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
