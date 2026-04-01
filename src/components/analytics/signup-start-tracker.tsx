'use client'

import { useEffect } from 'react'
import { emitClientAnalyticsEvent } from '@/lib/analytics/client'

const SIGNUP_STARTED_SESSION_KEY = 'sa_signup_started_emitted'

export function SignupStartTracker() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SIGNUP_STARTED_SESSION_KEY)) return
      sessionStorage.setItem(SIGNUP_STARTED_SESSION_KEY, '1')
    } catch {
      // Ignore sessionStorage access issues and still attempt event emission.
    }

    void emitClientAnalyticsEvent({
      name: 'signup_started',
      path: '/sign-up',
    })
  }, [])

  return null
}
