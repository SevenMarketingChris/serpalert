'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/admin')
    } else {
      setError('Invalid password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">SerpAlert</h1>
        <p className="text-sm text-muted-foreground text-center">Enter admin password to continue</p>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border rounded px-3 py-2 text-sm"
          autoFocus
        />
        <button type="submit" className="w-full bg-black text-white rounded px-3 py-2 text-sm font-medium hover:bg-gray-800">
          Sign in
        </button>
      </form>
    </div>
  )
}
