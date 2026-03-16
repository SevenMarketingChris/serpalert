import { signIn, auth } from '../../../auth'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/admin')

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">SerpAlert</h1>
        <p className="text-sm text-muted-foreground">Sign in to access the dashboard</p>
        <form action={async () => {
          'use server'
          await signIn('google', { redirectTo: '/admin' })
        }}>
          <button type="submit" className="w-full bg-black text-white rounded px-3 py-2 text-sm font-medium hover:bg-gray-800">
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  )
}
