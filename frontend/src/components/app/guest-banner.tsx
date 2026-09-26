import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { meQuery } from '@/lib/api/queries'
import { signOut } from '@/lib/auth-client'

export function GuestBanner() {
  const { data: me } = useQuery(meQuery)
  const navigate = useNavigate()
  if (!me?.isAnonymous) return null
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-highlight/25 px-4 py-2 text-sm">
      <p className="min-w-0 flex-1">
        You're using a guest account. It and everything in it is deleted after 7
        days.
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          await signOut()
          navigate({ to: '/login', search: { mode: 'signup' } })
        }}
      >
        Create an account
      </Button>
    </div>
  )
}
