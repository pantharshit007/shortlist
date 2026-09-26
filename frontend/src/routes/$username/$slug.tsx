import { createFileRoute, redirect } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { DownloadIcon, EyeOffIcon, LockIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PdfPages } from '@/components/editor/pdf-pages'
import { PublicMessage, PublicShell } from '@/components/public/public-shell'
import { ResumeDocument } from '@/components/public/resume-document'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import type { PublicResume } from '@/lib/api/types'
import { apiUrl } from '@/lib/env'
import { fetchPublicResume } from '@/lib/public-api'
import { site } from '@/lib/site'

export const Route = createFileRoute('/$username/$slug')({
  loader: async ({ params }) => {
    const outcome = await fetchPublicResume({
      data: { username: params.username, slug: params.slug },
    })
    // Old usernames still work; move the visitor to the current address.
    if (
      outcome.status === 'ok' &&
      outcome.data.username !== params.username.toLowerCase()
    ) {
      throw redirect({
        to: '/$username/$slug',
        params: { username: outcome.data.username, slug: params.slug },
      })
    }
    return outcome
  },
  head: ({ loaderData }) => {
    if (loaderData?.status !== 'ok') {
      const title =
        loaderData?.status === 'password'
          ? 'Protected resume'
          : loaderData?.status === 'expired'
            ? 'Link expired'
            : 'Resume not found'
      return {
        meta: [{ title }, { name: 'robots', content: 'noindex, nofollow' }],
      }
    }
    const name = loaderData.data.content?.basics.name || loaderData.data.title
    const headline = loaderData.data.content?.basics.headline
    return {
      meta: [
        { title: `${name} | Resume` },
        {
          name: 'description',
          content: headline ? `${name}, ${headline}` : `${name}'s resume`,
        },
        { property: 'og:title', content: `${name} | Resume` },
        // Share links are private by default; listing happens on the owner's profile page.
        { name: 'robots', content: 'noindex, nofollow' },
      ],
    }
  },
  component: SharePage,
})

function pdfPath(username: string, slug: string) {
  return `${apiUrl}/v1/public/users/${encodeURIComponent(username)}/resumes/${encodeURIComponent(slug)}/pdf`
}

async function fetchPdf(username: string, slug: string, password?: string) {
  const response = await fetch(pdfPath(username, slug), {
    headers: password ? { 'x-share-password': password } : {},
  })
  if (!response.ok) throw new Error('Could not load the PDF')
  return response.blob()
}

function PdfView({
  username,
  slug,
  password,
}: {
  username: string
  slug: string
  password?: string
}) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let objectUrl: string | null = null
    fetchPdf(username, slug, password)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => toast.error('Could not load this resume. Try refreshing.'))
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [username, slug, password])
  return url ? (
    <PdfPages url={url} />
  ) : (
    <Skeleton className="aspect-[17/22] w-full" />
  )
}

function PasswordForm({
  onSubmit,
  wrong,
}: {
  onSubmit: (password: string) => Promise<void>
  wrong: boolean
}) {
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 px-5 py-24">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted">
        <LockIcon className="size-5" />
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">
        This resume is protected
      </h1>
      <p className="text-muted-foreground">
        Enter the password you were given to view it.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          setPending(true)
          await onSubmit(password)
          setPending(false)
        }}
      >
        <FieldGroup>
          <Field data-invalid={wrong}>
            <FieldLabel htmlFor="share-password">Password</FieldLabel>
            <Input
              id="share-password"
              type="password"
              autoFocus
              aria-invalid={wrong}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {wrong && <FieldError>That password isn't right.</FieldError>}
          </Field>
          <Button type="submit" disabled={!password || pending}>
            {pending && <Spinner data-icon="inline-start" />}
            View resume
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}

function SharePage() {
  const initial = Route.useLoaderData()
  const { username, slug } = Route.useParams()
  const unlock = useServerFn(fetchPublicResume)
  const [outcome, setOutcome] = useState(initial)
  const [password, setPassword] = useState<string>()
  const [downloading, setDownloading] = useState(false)

  if (outcome.status === 'password' || outcome.status === 'wrong_password') {
    return (
      <PublicShell>
        <PasswordForm
          wrong={outcome.status === 'wrong_password'}
          onSubmit={async (value) => {
            const next = await unlock({
              data: { username, slug, password: value },
            })
            if (next.status === 'ok') setPassword(value)
            setOutcome(next)
          }}
        />
      </PublicShell>
    )
  }
  if (outcome.status === 'expired') {
    return (
      <PublicMessage
        title="This link has expired"
        body="Ask the person who shared it for a new link."
      />
    )
  }
  if (outcome.status !== 'ok') {
    return (
      <PublicMessage
        title={
          outcome.status === 'not_found'
            ? 'Resume not found'
            : 'Something went wrong'
        }
        body={
          outcome.status === 'not_found'
            ? 'The link may be mistyped, or its owner turned it off.'
            : 'We could not load this resume. Try again in a moment.'
        }
      />
    )
  }

  const resume: PublicResume = outcome.data

  async function download() {
    setDownloading(true)
    try {
      const blob = await fetchPdf(resume.username, resume.slug, password)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${(resume.content?.basics.name || resume.title).replace(/\s+/g, '_')}_Resume.pdf`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      toast.error('Could not download the PDF. Try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <PublicShell
      actions={
        <Button size="sm" onClick={download} disabled={downloading}>
          {downloading ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <DownloadIcon data-icon="inline-start" />
          )}
          Download PDF
        </Button>
      }
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-3 py-6 sm:px-6 sm:py-10">
        {resume.contactMasked &&
          resume.content &&
          (resume.content.basics.email || resume.content.basics.phone) ===
            undefined && (
            <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
              <EyeOffIcon className="size-4" />
              Contact details are hidden on this link.
            </p>
          )}
        <div className="overflow-hidden rounded-md shadow-[0_1px_2px_rgb(0_0_0/0.06),0_16px_48px_-16px_rgb(0_0_0/0.25)] ring-1 ring-black/5">
          {resume.content ? (
            <ResumeDocument content={resume.content} />
          ) : (
            <PdfView
              username={resume.username}
              slug={resume.slug}
              password={password}
            />
          )}
        </div>
        <p className="px-1 text-xs text-muted-foreground">
          {site.name} resume, updated{' '}
          {new Date(resume.updatedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>
    </PublicShell>
  )
}
