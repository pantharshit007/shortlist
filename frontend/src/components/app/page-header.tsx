import { SidebarTrigger } from '@/components/ui/sidebar'

export function PageHeader({
  title,
  description,
  actions,
  leading,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  // Shown before the title, e.g. the user's photo.
  leading?: React.ReactNode
}) {
  return (
    // On phones the actions get their own row, so they never squeeze the title into one word per line.
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <SidebarTrigger className="-ml-1 md:hidden" />
        {leading}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground tabular-nums">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
