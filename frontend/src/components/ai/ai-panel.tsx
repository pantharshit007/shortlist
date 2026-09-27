import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowUpIcon, PlusIcon, SparklesIcon, XIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { api, unwrap } from '@/lib/api/client'
import { aiErrorMessage } from '@/lib/api/errors'
import { jobsQuery, queryKeys } from '@/lib/api/queries'
import type { ResumeContent, Suggestion } from '@/lib/api/types'
import { CoverageReport } from './coverage-report'
import { SuggestionReview } from './suggestion-review'

export type AiPanelMode = 'tailor' | 'edit' | 'fix'

const quickRequests = [
  'Make every bullet start with a strong action verb',
  'Make the bullets shorter and more specific',
  'Trim it to fit on one page',
  'Bold the key technologies in each bullet',
]

export function NewJobForm({
  onCreated,
}: {
  onCreated: (jobId: string) => void
}) {
  const queryClient = useQueryClient()
  const [kind, setKind] = useState<'text' | 'url'>('text')
  const [value, setValue] = useState('')
  const create = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST('/v1/jobs', {
          body:
            kind === 'url'
              ? { sourceUrl: value.trim() }
              : { rawText: value.trim() },
        }),
      ),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs })
      toast.success(
        `Added ${[job.role, job.company].filter(Boolean).join(' at ') || 'the job'}`,
      )
      onCreated(job.id)
    },
    onError: (error) => toast.error(aiErrorMessage(error)),
  })

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={kind}
        onValueChange={(v) => v && setKind(v as typeof kind)}
      >
        <ToggleGroupItem value="text">Paste description</ToggleGroupItem>
        <ToggleGroupItem value="url">Job link</ToggleGroupItem>
      </ToggleGroup>
      {kind === 'text' ? (
        <div className="flex flex-col gap-1.5">
          <Textarea
            aria-label="Job description"
            rows={6}
            placeholder="Paste the full job description"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Paste the full description, not just the title.
          </p>
        </div>
      ) : (
        <Input
          aria-label="Job link"
          type="url"
          placeholder="https://careers.example.com/backend-engineer"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      )}
      <Button
        size="sm"
        className="self-start"
        disabled={
          create.isPending ||
          (kind === 'text' ? value.trim().length < 50 : !value.trim())
        }
        onClick={() => create.mutate()}
      >
        {create.isPending && <Spinner data-icon="inline-start" />}
        {create.isPending ? 'Reading the job…' : 'Add job'}
      </Button>
    </div>
  )
}

type SuggestBody =
  | { type: 'tailor'; jobId: string; instructions?: string }
  | { type: 'edit'; instruction: string }
  | { type: 'fix_compile' }

const pendingText: Record<SuggestBody['type'], string> = {
  tailor: 'Matching your resume to the job…',
  edit: 'Working on your request…',
  fix_compile: 'Fixing the LaTeX…',
}

// Docked beside the preview on wide screens, a slide-over sheet on smaller ones.
export function AiPanel({
  open,
  onOpenChange,
  docked,
  mode,
  resumeId,
  initialJobId,
  content,
  texSource,
  hasUnsavedChanges,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  docked: boolean
  mode: AiPanelMode
  resumeId: string
  initialJobId: string | null
  content: ResumeContent | null
  texSource: string | null
  hasUnsavedChanges: boolean
}) {
  const { data: jobs } = useQuery(jobsQuery)
  const [jobId, setJobId] = useState<string | null>(initialJobId)
  const [addingJob, setAddingJob] = useState(false)
  const [instructions, setInstructions] = useState('')
  const [request, setRequest] = useState('')
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const composer = useRef<HTMLTextAreaElement>(null)

  const suggest = useMutation({
    mutationFn: (body: SuggestBody) =>
      unwrap(
        api.POST('/v1/resumes/{resumeId}/suggestions', {
          params: { path: { resumeId } },
          body,
        }),
      ),
    onSuccess: (next, body) => {
      setSuggestion(next)
      if (body.type === 'edit') setRequest('')
    },
    onError: (error) => toast.error(aiErrorMessage(error)),
  })

  useEffect(() => {
    if (!open) return
    if (mode === 'fix' && !suggestion && !suggest.isPending)
      suggest.mutate({ type: 'fix_compile' })
    if (mode === 'edit') composer.current?.focus()
    // Only when the panel opens or switches mode.
  }, [open, mode])

  function sendRequest() {
    const instruction = request.trim()
    if (instruction.length >= 3 && !suggest.isPending)
      suggest.mutate({ type: 'edit', instruction })
  }

  const reviewing = suggestion !== null
  const title = reviewing
    ? 'Review changes'
    : mode === 'fix'
      ? 'Fix the LaTeX'
      : 'Improve with AI'
  const description = reviewing
    ? 'Nothing changes until you apply. Uncheck anything you want to keep as it is.'
    : 'Suggestions only use what is already in your resume and profile.'

  const body = (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4">
        {hasUnsavedChanges && !reviewing && (
          <Alert className="mb-4">
            <AlertDescription>
              Your latest edits are still saving. Suggestions use the last saved
              version.
            </AlertDescription>
          </Alert>
        )}

        {suggest.isPending ? (
          <div
            className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground"
            aria-live="polite"
          >
            <Spinner className="size-6" />
            <p>{pendingText[suggest.variables.type]}</p>
            <p className="text-sm">This takes 10 to 30 seconds.</p>
          </div>
        ) : suggestion ? (
          <SuggestionReview
            resumeId={resumeId}
            suggestion={suggestion}
            content={content}
            texSource={texSource}
            onApplied={() => {
              setSuggestion(null)
              if (!docked) onOpenChange(false)
            }}
            onDiscard={() => setSuggestion(null)}
          />
        ) : mode === 'fix' && suggest.isError ? (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground">Couldn't prepare a fix.</p>
            <Button
              className="self-start"
              onClick={() => suggest.mutate({ type: 'fix_compile' })}
            >
              Try again
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <section
              aria-labelledby="ai-tailor"
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <h3
                  id="ai-tailor"
                  className="font-sans text-base font-semibold"
                >
                  Tailor to a job
                </h3>
                <p className="text-sm text-muted-foreground">
                  Reorders, trims and rephrases your resume for one job.
                </p>
              </div>
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="job">Job</FieldLabel>
                  {jobs && jobs.length > 0 && !addingJob ? (
                    <div className="flex gap-2">
                      <Select
                        value={jobId ?? undefined}
                        onValueChange={setJobId}
                      >
                        <SelectTrigger id="job" className="min-w-0 flex-1">
                          <SelectValue placeholder="Choose a job" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {jobs.map((job) => (
                              <SelectItem key={job.id} value={job.id}>
                                {[job.role, job.company]
                                  .filter(Boolean)
                                  .join(' at ') || 'Untitled job'}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Add a new job"
                        onClick={() => setAddingJob(true)}
                      >
                        <PlusIcon />
                      </Button>
                    </div>
                  ) : (
                    <NewJobForm
                      onCreated={(id) => {
                        setJobId(id)
                        setAddingJob(false)
                      }}
                    />
                  )}
                  <FieldDescription>
                    Jobs you add are saved on the{' '}
                    <Link to="/jobs" className="underline underline-offset-2">
                      Jobs page
                    </Link>
                    .
                  </FieldDescription>
                </Field>

                {jobId && content && (
                  <CoverageReport resumeId={resumeId} jobId={jobId} />
                )}

                <Field>
                  <FieldLabel htmlFor="instructions">
                    Anything to focus on? (optional)
                  </FieldLabel>
                  <Textarea
                    id="instructions"
                    rows={2}
                    placeholder="Focus on backend work and drop the college fest project"
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                  />
                </Field>
                <Button
                  disabled={!jobId}
                  onClick={() =>
                    jobId &&
                    suggest.mutate({
                      type: 'tailor',
                      jobId,
                      ...(instructions.trim() && {
                        instructions: instructions.trim(),
                      }),
                    })
                  }
                >
                  <SparklesIcon data-icon="inline-start" />
                  Tailor resume
                </Button>
              </FieldGroup>
            </section>

            <section aria-labelledby="ai-quick" className="flex flex-col gap-3">
              <h3 id="ai-quick" className="font-sans text-base font-semibold">
                Quick changes
              </h3>
              <div className="flex flex-wrap gap-2">
                {quickRequests.map((quick) => (
                  <Button
                    key={quick}
                    variant="outline"
                    size="sm"
                    className="h-auto py-1.5 text-left whitespace-normal"
                    onClick={() =>
                      suggest.mutate({ type: 'edit', instruction: quick })
                    }
                  >
                    {quick}
                  </Button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {!reviewing && !suggest.isPending && (
        <form
          className="shrink-0 border-t p-3"
          onSubmit={(event) => {
            event.preventDefault()
            sendRequest()
          }}
        >
          <div className="flex flex-col gap-2 rounded-lg border bg-background p-2 focus-within:ring-2 focus-within:ring-ring">
            <Textarea
              ref={composer}
              aria-label="Ask for a change"
              rows={2}
              placeholder="Ask for a change, like: rewrite my project bullets to show impact"
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  sendRequest()
                }
              }}
              className="min-h-0 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                You review every change before it's applied
              </span>
              <Button
                type="submit"
                size="icon-sm"
                aria-label="Send"
                disabled={request.trim().length < 3}
              >
                <ArrowUpIcon />
              </Button>
            </div>
          </div>
        </form>
      )}
    </>
  )

  if (docked) {
    if (!open) return null
    return (
      <aside
        aria-label="AI assistant"
        className="flex h-full min-h-0 flex-col bg-card"
      >
        <div className="flex shrink-0 items-start gap-2 border-b p-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="font-sans text-base font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close AI panel"
            onClick={() => onOpenChange(false)}
          >
            <XIcon />
          </Button>
        </div>
        {body}
      </aside>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {body}
      </SheetContent>
    </Sheet>
  )
}
