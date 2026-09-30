import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { site } from '@/lib/site'
import { ThemeProvider, themeScript } from '@/lib/theme'
import type { RouterContext } from '../router'
import appCss from '../styles.css?url'
import { initAnalytics } from '@/lib/analytics'
import { useEffect } from 'react'

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: `${site.name}: resumes tailored to every job` },
      { name: 'description', content: site.description },
      {
        name: 'theme-color',
        content: '#eef0eb',
        media: '(prefers-color-scheme: light)',
      },
      {
        name: 'theme-color',
        content: '#121816',
        media: '(prefers-color-scheme: dark)',
      },
      { property: 'og:site_name', content: site.name },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
  errorComponent: ErrorPage,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(initAnalytics, [])
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}

function StatusPage({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{body}</p>
      <Button asChild className="self-start">
        <Link to="/">Go to the home page</Link>
      </Button>
    </div>
  )
}

function NotFound() {
  return (
    <StatusPage
      title="Page not found"
      body="The page may have moved, or the link is mistyped."
    />
  )
}

function ErrorPage() {
  return (
    <StatusPage
      title="Something went wrong"
      body="An unexpected error stopped this page from loading. Try refreshing."
    />
  )
}
