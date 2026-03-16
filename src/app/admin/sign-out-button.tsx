'use client'
import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-[12px] text-[#636360] hover:text-[#A0A09E] transition-colors"
    >
      Sign out
    </button>
  )
}
