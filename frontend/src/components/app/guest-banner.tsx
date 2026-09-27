import { useQuery } from '@tanstack/react-query'
import { useMatchRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { meQuery } from '@/lib/api/queries'
import { signOut } from '@/lib/auth-client'

export function GuestBanner() {
  const { data: me } = useQuery(meQuery)
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()
  // Editors fill the screen; the banner shows on every other page.
  const inEditor = (
    [
      '/resumes/$resumeId',
      '/my-templates/$customTemplateId',
      '/my-templates/new',
    ] as const
  ).some((to) => matchRoute({ to }) !== false)
  if (!me?.isAnonymous || inEditor) return null
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-card px-4 py-2 text-sm">
      <p className="flex min-w-0 flex-1 items-center gap-2.5">
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full bg-highlight"
        />
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
