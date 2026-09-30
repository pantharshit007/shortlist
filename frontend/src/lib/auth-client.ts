import { createAuthClient } from 'better-auth/react'
import { anonymousClient } from 'better-auth/client/plugins'
import { apiUrl } from '@/lib/env'
import { resetAnalytics } from '@/lib/analytics'

export const authClient = createAuthClient({
  baseURL: apiUrl,
  plugins: [anonymousClient()],
})

export const { useSession, signIn } = authClient

// Signing out also forgets the analytics identity, so the next person on this browser starts fresh.
export function signOut(...args: Parameters<typeof authClient.signOut>) {
  resetAnalytics()
  return authClient.signOut(...args)
}

// One-click guest accounts: on in development unless turned off, opt-in elsewhere.
const guestLoginFlag = import.meta.env.VITE_ENABLE_GUEST_LOGIN as
  string | undefined
export const guestLoginEnabled = guestLoginFlag
  ? guestLoginFlag === 'true'
  : import.meta.env.DEV
