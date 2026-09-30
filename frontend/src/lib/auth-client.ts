import { createAuthClient } from 'better-auth/react'
import { anonymousClient } from 'better-auth/client/plugins'
import { apiUrl } from '@/lib/env'
import { resetAnalytics } from '@/lib/analytics'

export const authClient = createAuthClient({
  baseURL: apiUrl,
  plugins: [anonymousClient()],
})

export const { useSession, signIn } = authClient

type SessionResult = ReturnType<typeof authClient.getSession>
let cachedSession: { at: number; result: SessionResult } | null = null

// Every navigation inside the app checks the session; a signed-in answer is reused for a minute instead of
// asking the API each time. A signed-out answer is never kept, so signing in takes effect at once.
export function getSession(): SessionResult {
  if (cachedSession && Date.now() - cachedSession.at < 60_000) {
    return cachedSession.result
  }
  const result = authClient.getSession()
  cachedSession = { at: Date.now(), result }
  void result.then(
    ({ data }) => {
      if (!data) cachedSession = null
    },
    () => {
      cachedSession = null
    },
  )
  return result
}

// Signing out also forgets the analytics identity, so the next person on this browser starts fresh.
export function signOut(...args: Parameters<typeof authClient.signOut>) {
  cachedSession = null
  resetAnalytics()
  return authClient.signOut(...args)
}

// One-click guest accounts: on in development unless turned off, opt-in elsewhere.
const guestLoginFlag = import.meta.env.VITE_ENABLE_GUEST_LOGIN as
  string | undefined
export const guestLoginEnabled = guestLoginFlag
  ? guestLoginFlag === 'true'
  : import.meta.env.DEV
