import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  CheckIcon,
  CodeIcon,
  FilePlusIcon,
  FileUpIcon,
  UploadCloudIcon,
  UserRoundIcon,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { PageHeader } from '@/components/app/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ApiError, api, errorMessage, unwrap } from '@/lib/api/client'
import { profileQuery } from '@/lib/api/queries'
import type { CreateResumeBody, ResumeContent } from '@/lib/api/types'
import { apiUrl } from '@/lib/env'
import { site } from '@/lib/site'
import { templateCatalog } from '@/lib/templates'
import type { TemplateId } from '@/lib/templates'
import { cn } from '@/lib/utils'

const searchSchema = z.object({
  template: z.string().optional(),
  source: z.enum(['blank', 'profile', 'upload', 'tex']).optional(),
})

export const Route = createFileRoute('/_app/resumes/new')({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: `New resume | ${site.name}` }] }),
  component: NewResumePage,
})

type Source = 'profile' | 'upload' | 'tex' | 'blank'

const sources = [
  {
    id: 'profile',
    icon: UserRoundIcon,
    title: 'From my profile',
    body: 'Use everything in your profile',
  },
  {
    id: 'upload',
    icon: FileUpIcon,
    title: 'Import a file',
    body: 'PDF, .tex or text file',
  },
  {
    id: 'tex',
    icon: CodeIcon,
    title: 'Paste LaTeX',
    body: 'Keep editing your Overleaf code',
  },
  {
    id: 'blank',
    icon: FilePlusIcon,
    title: 'Start blank',
    body: 'Fill in a form from scratch',
  },
] as const

function TemplatePicker({
  value,
  onChange,
}: {
  value: TemplateId
  onChange: (id: TemplateId) => void
}) {
  return (
    <FieldSet>
      <FieldLegend>Template</FieldLegend>
      <FieldDescription>You can switch templates anytime.</FieldDescription>
      <div
        role="radiogroup"
        aria-label="Template"
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {templateCatalog.map((template) => {
          const selected = template.id === value
          return (
            <button
              key={template.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(template.id)}
              className={cn(
                'group flex flex-col gap-2 rounded-lg p-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected && 'bg-primary/10',
              )}
            >
              <span className="relative block">
                <img
                  src={`/templates/${template.id}.png`}
                  alt=""
                  className={cn(
                    'aspect-[17/22] w-full rounded-sm bg-sheet object-cover object-top ring-1 ring-black/10 transition',
                    selected
                      ? 'ring-2 ring-primary'
                      : 'group-hover:ring-foreground/30',
                  )}
                />
                {selected && (
                  <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckIcon className="size-4" />
                  </span>
                )}
              </span>
              <span className="px-0.5 text-sm font-medium">
                {template.name}
              </span>
            </button>
          )
        })}
      </div>
    </FieldSet>
  )
}

function NewResumePage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: profile } = useQuery(profileQuery)
  const hasProfile = Boolean(profile?.updatedAt)

  const initialTemplate = templateCatalog.some((t) => t.id === search.template)
    ? (search.template as TemplateId)
    : 'developer'
  const [source, setSource] = useState<Source>(
    search.source ?? (hasProfile ? 'profile' : 'upload'),
  )
  const [title, setTitle] = useState('')
  const [templateId, setTemplateId] = useState<TemplateId>(initialTemplate)
  const [texSource, setTexSource] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [texChoice, setTexChoice] = useState<'code' | 'form'>('code')
  const [saveToProfile, setSaveToProfile] = useState(true)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const isTexFile = file ? /\.tex$/i.test(file.name) : false
  const makesCodeResume =
    source === 'tex' ||
    (source === 'upload' && isTexFile && texChoice === 'code')

  async function importContent(): Promise<ResumeContent> {
    if (file) {
      const form = new FormData()
      form.append('file', file)
      const response = await fetch(`${apiUrl}/v1/uploads`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      })
      const body = await response.json()
      if (!response.ok)
        throw new ApiError(
          response.status,
          body.error?.code,
          body.error?.message,
          body.error?.details,
        )
      const imported = await unwrap(
        api.POST('/v1/imports', { body: { uploadId: body.data.id } }),
      )
      return imported.content
    }
    const imported = await unwrap(
      api.POST('/v1/imports', { body: { text: pastedText } }),
    )
    return imported.content
  }

  const create = useMutation({
    mutationFn: async () => {
      const name = title.trim() || 'Untitled resume'
      let body: CreateResumeBody

      if (makesCodeResume) {
        const tex = source === 'tex' ? texSource : await file!.text()
        body = {
          title: name,
          mode: 'code',
          source: { type: 'tex', texSource: tex },
        }
      } else if (source === 'upload') {
        const content = await importContent()
        if (saveToProfile && !hasProfile) {
          await unwrap(api.PUT('/v1/profile', { body: { content } }))
          queryClient.invalidateQueries({ queryKey: ['profile'] })
        }
        body = {
          title: name,
          mode: 'structured',
          templateId,
          source: { type: 'content', content },
        }
      } else {
        body = {
          title: name,
          mode: 'structured',
          templateId,
          source: { type: source },
        }
      }
      return unwrap(api.POST('/v1/resumes', { body }))
    },
    onSuccess: (resume) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
      navigate({ to: '/resumes/$resumeId', params: { resumeId: resume.id } })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'AI_NOT_CONFIGURED') {
        toast.error(
          'Importing needs AI, which is not set up yet. Start blank or paste LaTeX instead.',
        )
      } else {
        toast.error(errorMessage(error))
      }
    },
  })

  const canSubmit =
    source === 'tex'
      ? texSource.trim().length > 0
      : source === 'upload'
        ? Boolean(file) || pastedText.trim().length >= 20
        : source === 'profile'
          ? hasProfile
          : true

  function pickFile(next: File | undefined) {
    if (!next) return
    if (next.size > 5 * 1024 * 1024) {
      toast.error('Files can be at most 5 MB.')
      return
    }
    setFile(next)
    if (!title) setTitle(next.name.replace(/\.[^.]+$/, ''))
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-8 sm:px-8">
      <PageHeader
        title="New resume"
        description="Start from what you have. You can tailor it to a job next."
      />

      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (canSubmit) create.mutate()
        }}
      >
        <FieldGroup className="gap-8">
          <Field className="max-w-md">
            <FieldLabel htmlFor="title">Name</FieldLabel>
            <Input
              id="title"
              placeholder="Backend roles, 2026"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <FieldDescription>
              Only you see this. Name it after the role or company you are
              applying to.
            </FieldDescription>
          </Field>

          <FieldSet>
            <FieldLegend>Start from</FieldLegend>
            <ToggleGroup
              type="single"
              value={source}
              onValueChange={(value) => value && setSource(value as Source)}
              className="grid w-full auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-4"
              aria-label="Start from"
            >
              {sources.map((option) => (
                <ToggleGroupItem
                  key={option.id}
                  value={option.id}
                  disabled={option.id === 'profile' && !hasProfile}
                  className="flex h-full flex-col items-start justify-start gap-1.5 rounded-lg border bg-card p-4 text-left whitespace-normal data-[state=on]:border-primary data-[state=on]:bg-primary/10"
                >
                  <option.icon className="text-primary" />
                  <span className="font-medium">{option.title}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {option.id === 'profile' && !hasProfile
                      ? 'Your profile is empty'
                      : option.body}
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FieldSet>

          {source === 'upload' && (
            <div className="flex flex-col gap-4">
              <div
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragging(false)
                  pickFile(event.dataTransfer.files[0])
                }}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-card px-6 py-10 text-center transition-colors',
                  dragging && 'border-primary bg-primary/5',
                )}
              >
                <UploadCloudIcon className="size-8 text-muted-foreground" />
                {file ? (
                  <p>
                    <span className="font-medium">{file.name}</span>{' '}
                    <span className="text-muted-foreground">
                      ({Math.ceil(file.size / 1024)} KB)
                    </span>
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Drop your resume here, or choose a file
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInput.current?.click()}
                >
                  {file ? 'Choose a different file' : 'Choose file'}
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".pdf,.tex,.txt,application/pdf,text/plain"
                  className="sr-only"
                  onChange={(event) => pickFile(event.target.files?.[0])}
                />
                <p className="text-xs text-muted-foreground">
                  PDF, .tex or .txt, up to 5 MB
                </p>
              </div>

              {isTexFile ? (
                <FieldSet>
                  <FieldLegend variant="label">
                    This is a LaTeX file. How do you want to edit it?
                  </FieldLegend>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={texChoice}
                    onValueChange={(value) =>
                      value && setTexChoice(value as typeof texChoice)
                    }
                  >
                    <ToggleGroupItem value="code">
                      Keep as LaTeX
                    </ToggleGroupItem>
                    <ToggleGroupItem value="form">
                      Convert to form
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FieldSet>
              ) : (
                !file && (
                  <Field>
                    <FieldLabel htmlFor="pasted">
                      Or paste your resume as text
                    </FieldLabel>
                    <Textarea
                      id="pasted"
                      rows={6}
                      placeholder="Copy everything from your current resume and paste it here"
                      value={pastedText}
                      onChange={(event) => setPastedText(event.target.value)}
                    />
                  </Field>
                )
              )}

              {!makesCodeResume && !hasProfile && (
                <Field orientation="horizontal">
                  <Checkbox
                    id="save-profile"
                    checked={saveToProfile}
                    onCheckedChange={(checked) =>
                      setSaveToProfile(checked === true)
                    }
                  />
                  <FieldLabel htmlFor="save-profile" className="font-normal">
                    Also save it as my profile, so future resumes can start from
                    it
                  </FieldLabel>
                </Field>
              )}
            </div>
          )}

          {source === 'tex' && (
            <Field>
              <FieldLabel htmlFor="tex">LaTeX source</FieldLabel>
              <Textarea
                id="tex"
                rows={12}
                spellCheck={false}
                className="font-mono text-sm"
                placeholder={'\\documentclass[letterpaper,10pt]{article}\n...'}
                value={texSource}
                onChange={(event) => setTexSource(event.target.value)}
              />
              <FieldDescription>
                Paste the full main.tex from Overleaf. Single-file documents
                work; images and extra files are not supported.
              </FieldDescription>
            </Field>
          )}

          {source === 'profile' && hasProfile && (
            <Alert>
              <UserRoundIcon />
              <AlertTitle>Everything from your profile goes in</AlertTitle>
              <AlertDescription>
                Tailor it to a job afterwards to keep only what matters for that
                role.
              </AlertDescription>
            </Alert>
          )}

          {!makesCodeResume && (
            <TemplatePicker value={templateId} onChange={setTemplateId} />
          )}

          <div className="flex flex-wrap items-center gap-3 border-t pt-6">
            <Button
              type="submit"
              size="lg"
              disabled={!canSubmit || create.isPending}
            >
              {create.isPending && <Spinner data-icon="inline-start" />}
              {create.isPending && source === 'upload' && !makesCodeResume
                ? 'Reading your resume'
                : 'Create resume'}
            </Button>
            {create.isPending && source === 'upload' && !makesCodeResume && (
              <p className="text-sm text-muted-foreground" aria-live="polite">
                This takes about 10 seconds.
              </p>
            )}
          </div>
        </FieldGroup>
      </form>
    </div>
  )
}
