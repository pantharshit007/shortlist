import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app/app-sidebar'
import { GuestBanner } from '@/components/app/guest-banner'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'
import { identifyUser } from '@/lib/analytics'

export const Route = createFileRoute('/_app')({
  // App pages render in the browser only; the session cookie belongs to the API domain.
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await authClient.getSession()
    if (!data) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    identifyUser(data.user.id)
    return { user: data.user }
  },
  component: AppLayout,
})

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset
        id="main"
        tabIndex={-1}
        className="bg-background outline-none"
      >
        <GuestBanner />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
