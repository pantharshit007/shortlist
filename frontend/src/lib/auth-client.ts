import { createAuthClient } from 'better-auth/react'
import { magicLinkClient } from 'better-auth/client/plugins'
import { apiUrl } from '@/lib/env'

export const authClient = createAuthClient({
  baseURL: apiUrl,
  plugins: [magicLinkClient()],
})

export const { useSession, signIn, signOut } = authClient
