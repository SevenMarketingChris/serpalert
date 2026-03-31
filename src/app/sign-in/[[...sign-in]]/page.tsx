import { SignIn } from '@clerk/nextjs'

export const metadata = {
  title: 'Sign In — SerpAlert',
  description: 'Sign in to your SerpAlert account to monitor competitor ad activity.',
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <h1 className="text-2xl font-bold text-foreground mb-6">Sign In</h1>
      <SignIn fallbackRedirectUrl="/dashboard" />
    </div>
  )
}
