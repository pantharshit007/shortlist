import { Link } from '@tanstack/react-router'
import { LogoMark } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { site } from '@/lib/site'

export function PublicShell({
  children,
  actions,
}: {
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <Link
            to="/"
            aria-label={`Made with ${site.name}`}
            className="flex items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-foreground"
          >
            <LogoMark className="size-6" />
            <span className="hidden sm:inline">Made with {site.name}</span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            {actions}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Want a resume like this?{' '}
        <Link
          to="/login"
          search={{ mode: 'signup' }}
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
        >
          Make yours free on {site.name}
        </Link>
        <p className="mx-auto mt-3 max-w-md px-4 text-xs">
          The owner of a shared resume sees roughly where and on what device it
          was opened, never your name.{' '}
          <Link to="/privacy" className="underline underline-offset-4">
            Privacy
          </Link>
        </p>
      </footer>
    </div>
  )
}

export function PublicMessage({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <PublicShell>
      <div className="mx-auto flex max-w-md flex-col items-start gap-3 px-5 py-24">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{body}</p>
      </div>
    </PublicShell>
  )
}
