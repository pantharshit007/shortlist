import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { ChevronDownIcon } from 'lucide-react'
import { docGroups, docs } from '@/lib/docs'

export const Route = createFileRoute('/_site/docs')({
  component: DocsLayout,
})

function DocsNav() {
  return (
    <nav aria-label="Docs" className="flex flex-col gap-6 text-sm">
      <Link
        to="/docs"
        activeOptions={{ exact: true }}
        className="w-fit font-medium text-muted-foreground hover:text-foreground data-[status=active]:text-foreground"
      >
        Overview
      </Link>
      {docGroups.map((group) => (
        <div key={group} className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {group}
          </p>
          <ul className="flex flex-col gap-0.5 border-l">
            {docs
              .filter((doc) => doc.group === group)
              .map((doc) => (
                <li key={doc.slug}>
                  <Link
                    to="/docs/$slug"
                    params={{ slug: doc.slug }}
                    className="-ml-px block border-l border-transparent py-1.5 pl-3 text-muted-foreground hover:border-border hover:text-foreground data-[status=active]:border-primary data-[status=active]:font-medium data-[status=active]:text-foreground"
                  >
                    {doc.title}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function DocsLayout() {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 pt-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 lg:pt-14">
      <aside className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100svh-7rem)] overflow-y-auto pb-8">
          <DocsNav />
        </div>
      </aside>
      <details className="group rounded-lg border bg-card lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          Browse the docs
          <ChevronDownIcon
            aria-hidden
            className="size-4 transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="border-t px-4 py-4">
          <DocsNav />
        </div>
      </details>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
