import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div>
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
