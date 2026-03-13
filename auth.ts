import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_AUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    signIn({ profile }) {
      if (!profile?.email) return false
      if (ALLOWED_EMAILS.length === 0) return true
      return ALLOWED_EMAILS.includes(profile.email)
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
