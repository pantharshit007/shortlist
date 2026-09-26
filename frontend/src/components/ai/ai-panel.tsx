import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PlusIcon, SparklesIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

function NewJobForm({ onCreated }: { onCreated: (jobId: string) => void }) {
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
        <Textarea
          aria-label="Job description"
          rows={6}
          placeholder="Paste the full job description"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
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
        {create.isPending ? 'Reading the job' : 'Add job'}
      </Button>
    </div>
  )
}

export function AiPanel({
  open,
  onOpenChange,
  mode,
  onModeChange,
  resumeId,
  initialJobId,
  content,
  texSource,
  hasUnsavedChanges,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: AiPanelMode
  onModeChange: (mode: AiPanelMode) => void
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

  const suggest = useMutation({
    mutationFn: (
      body:
        | { type: 'tailor'; jobId: string; instructions?: string }
        | { type: 'edit'; instruction: string }
        | { type: 'fix_compile' },
    ) =>
      unwrap(
        api.POST('/v1/resumes/{resumeId}/suggestions', {
          params: { path: { resumeId } },
          body,
        }),
      ),
    onSuccess: setSuggestion,
    onError: (error) => toast.error(aiErrorMessage(error)),
  })

  useEffect(() => {
    if (open && mode === 'fix' && !suggestion && !suggest.isPending)
      suggest.mutate({ type: 'fix_compile' })
    // Only when the panel opens in fix mode.
  }, [open, mode])

  useEffect(() => {
    if (!open) {
      setSuggestion(null)
      suggest.reset()
    }
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>
            {suggestion
              ? 'Review changes'
              : mode === 'fix'
                ? 'Fix the LaTeX'
                : 'Improve with AI'}
          </SheetTitle>
          <SheetDescription>
            {suggestion
              ? 'Nothing changes until you apply. Uncheck anything you want to keep as it is.'
              : 'Suggestions only use what is already in your resume and profile.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          {hasUnsavedChanges && !suggestion && (
            <Alert className="mb-4">
              <AlertDescription>
                Your latest edits are still saving. Suggestions use the last
                saved version.
              </AlertDescription>
            </Alert>
          )}

          {suggest.isPending ? (
            <div
              className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground"
              aria-live="polite"
            >
              <Spinner className="size-6" />
              <p>
                {mode === 'tailor'
                  ? 'Matching your resume to the job'
                  : mode === 'fix'
                    ? 'Fixing the LaTeX'
                    : 'Working on your request'}
              </p>
              <p className="text-sm">This takes 10 to 30 seconds.</p>
            </div>
          ) : suggestion ? (
            <SuggestionReview
              resumeId={resumeId}
              suggestion={suggestion}
              content={content}
              texSource={texSource}
              onApplied={() => onOpenChange(false)}
              onDiscard={() => setSuggestion(null)}
            />
          ) : mode === 'fix' ? (
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
            <Tabs
              value={mode}
              onValueChange={(value) => onModeChange(value as AiPanelMode)}
              className="gap-4"
            >
              <TabsList className="w-full">
                <TabsTrigger value="tailor">Tailor to a job</TabsTrigger>
                <TabsTrigger value="edit">Ask for changes</TabsTrigger>
              </TabsList>

              <TabsContent value="tailor" className="flex flex-col gap-4">
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel htmlFor="job">Job</FieldLabel>
                    {jobs && jobs.length > 0 && !addingJob ? (
                      <div className="flex gap-2">
                        <Select
                          value={jobId ?? undefined}
                          onValueChange={setJobId}
                        >
                          <SelectTrigger id="job" className="flex-1">
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
                      rows={3}
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
              </TabsContent>

              <TabsContent value="edit" className="flex flex-col gap-4">
                <Field>
                  <FieldLabel htmlFor="request">What should change?</FieldLabel>
                  <Textarea
                    id="request"
                    rows={4}
                    placeholder="Rewrite my project bullets to show impact"
                    value={request}
                    onChange={(event) => setRequest(event.target.value)}
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  {quickRequests.map((quick) => (
                    <Button
                      key={quick}
                      variant="outline"
                      size="sm"
                      className="h-auto py-1.5 text-left whitespace-normal"
                      onClick={() => setRequest(quick)}
                    >
                      {quick}
                    </Button>
                  ))}
                </div>
                <Button
                  disabled={request.trim().length < 3}
                  onClick={() =>
                    suggest.mutate({
                      type: 'edit',
                      instruction: request.trim(),
                    })
                  }
                >
                  <SparklesIcon data-icon="inline-start" />
                  Suggest changes
                </Button>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
