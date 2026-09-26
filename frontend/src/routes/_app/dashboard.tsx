import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  CodeIcon,
  FilePlusIcon,
  FileTextIcon,
  FileUpIcon,
  PlusIcon,
  UserRoundIcon,
} from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/app/page-header'
import { ResumeActions } from '@/components/app/resume-actions'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { profileQuery, resumesQuery, usageQuery } from '@/lib/api/queries'
import { timeAgo } from '@/lib/format'
import { site } from '@/lib/site'
import { templateCatalog } from '@/lib/templates'

export const Route = createFileRoute('/_app/dashboard')({
  head: () => ({ meta: [{ title: `Resumes | ${site.name}` }] }),
  component: DashboardPage,
})

const startOptions = [
  {
    source: 'upload',
    icon: FileUpIcon,
    title: 'Import a resume',
    body: 'Upload a PDF or text file',
  },
  {
    source: 'tex',
    icon: CodeIcon,
    title: 'Paste LaTeX',
    body: 'Bring your Overleaf file',
  },
  {
    source: 'blank',
    icon: FilePlusIcon,
    title: 'Start blank',
    body: 'Fill in a form',
  },
] as const

function templateName(id: string | null) {
  return templateCatalog.find((t) => t.id === id)?.name
}

function DashboardPage() {
  const [view, setView] = useState<'active' | 'archived'>('active')
  const resumes = useQuery(resumesQuery(view === 'archived'))
  const { data: usage } = useQuery(usageQuery)
  const { data: profile } = useQuery(profileQuery)
  const profileEmpty = profile && !profile.updatedAt

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-8 sm:px-8">
      <PageHeader
        title="Resumes"
        description={
          usage &&
          `${usage.resumes.used} of ${usage.resumes.limit >= 1000 ? 'unlimited' : usage.resumes.limit} resumes, ${usage.tailor.used} of ${usage.tailor.limit} tailored versions this month`
        }
        actions={
          <Button asChild>
            <Link to="/resumes/new">
              <PlusIcon data-icon="inline-start" />
              New resume
            </Link>
          </Button>
        }
      />

      {profileEmpty && (
        <Alert>
          <UserRoundIcon />
          <AlertTitle>Add your details once, reuse them everywhere</AlertTitle>
          <AlertDescription>
            Your profile holds every job, project and skill. Tailoring picks
            from it, and never adds anything that isn't there.
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" asChild>
              <Link to="/profile">Fill in profile</Link>
            </Button>
          </AlertAction>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-4">
        <ToggleGroup
          type="single"
          variant="outline"
          value={view}
          onValueChange={(value) => value && setView(value as typeof view)}
          aria-label="Show resumes"
        >
          <ToggleGroupItem value="active">Active</ToggleGroupItem>
          <ToggleGroupItem value="archived">Archived</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {resumes.isPending ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-18 w-full" />
          ))}
        </div>
      ) : resumes.data && resumes.data.length > 0 ? (
        <ul className="flex flex-col divide-y rounded-xl border bg-card">
          {resumes.data.map((resume) => (
            <li
              key={resume.id}
              className="group relative flex items-center gap-4 px-4 py-3.5 focus-within:bg-accent/40 focus-within:ring-2 focus-within:ring-ring focus-within:ring-inset sm:px-5 first:rounded-t-xl last:rounded-b-xl"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                {resume.mode === 'code' ? (
                  <CodeIcon className="size-5" />
                ) : (
                  <FileTextIcon className="size-5" />
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Link
                  to="/resumes/$resumeId"
                  params={{ resumeId: resume.id }}
                  className="truncate font-medium after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {resume.title}
                </Link>
                <p className="truncate text-sm text-muted-foreground">
                  {resume.mode === 'code'
                    ? 'LaTeX'
                    : (templateName(resume.templateId) ?? 'Form')}
                  , edited {timeAgo(resume.updatedAt)}
                </p>
              </div>
              {resume.jobId && (
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  Tailored
                </Badge>
              )}
              <div className="relative z-10">
                <ResumeActions resume={resume} />
              </div>
            </li>
          ))}
        </ul>
      ) : view === 'archived' ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No archived resumes</EmptyTitle>
            <EmptyDescription>
              Resumes you archive from the menu show up here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon />
            </EmptyMedia>
            <EmptyTitle>Create your first resume</EmptyTitle>
            <EmptyDescription>
              Start from what you already have. You can tailor it to a job right
              after.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="max-w-2xl">
            <div className="grid w-full gap-3 sm:grid-cols-3">
              {startOptions.map((option) => (
                <Link
                  key={option.source}
                  to="/resumes/new"
                  search={{ source: option.source }}
                  className="flex flex-col items-start gap-2 rounded-lg border bg-background p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  <option.icon className="size-5 text-primary" />
                  <span className="font-medium">{option.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {option.body}
                  </span>
                </Link>
              ))}
            </div>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
