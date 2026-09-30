import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  HistoryIcon,
  Share2Icon,
  SparklesIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'
import { toast } from 'sonner'
import { z } from 'zod'
import { AiPanel } from '@/components/ai/ai-panel'
import type { AiPanelMode } from '@/components/ai/ai-panel'
import { ContentEditor } from '@/components/editor/content-editor'
import { DownloadMenu } from '@/components/editor/download-menu'
import { HistoryPanel } from '@/components/editor/history-panel'
import { SharePanel } from '@/components/editor/share-panel'
import { UnsavedChangesGuard } from '@/components/app/unsaved-changes-guard'
import { SaveTemplateDialog } from '@/components/templates/save-template-dialog'
import { LatexEditor } from '@/components/editor/latex-editor'
import type { LatexEditorHandle } from '@/components/editor/latex-editor'
import { PdfPreview } from '@/components/editor/pdf-preview'
import type { SaveState } from '@/components/editor/save-status'
import { SaveStatus } from '@/components/editor/save-status'
import { Button } from '@/components/ui/button'
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
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCollapsedSidebar } from '@/hooks/use-collapsed-sidebar'
import { useDebouncedEffect } from '@/hooks/use-debounced-effect'
import { useMediaQuery } from '@/hooks/use-media-query'
import { usePdfPreview } from '@/hooks/use-pdf-preview'
import { api, errorMessage, unwrap } from '@/lib/api/client'
import { queryKeys, resumeQuery } from '@/lib/api/queries'
import type { ResumeContent, ResumeDetail } from '@/lib/api/types'
import { panelStorage } from '@/lib/panel-storage'
import { site } from '@/lib/site'
import { templateCatalog } from '@/lib/templates'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/resumes/$resumeId')({
  validateSearch: z.object({
    tailor: z.string().optional(),
    created: z.boolean().optional(),
  }),
  head: () => ({ meta: [{ title: `Editor | ${site.name}` }] }),
  component: EditorRoute,
})

function EditorRoute() {
  const { resumeId } = Route.useParams()
  const { data: resume, isPending, error } = useQuery(resumeQuery(resumeId))
  const { tailor } = Route.useSearch()
  // Lives above the editor so the AI panel stays open when applied changes remount it.
  const [aiOpen, setAiOpen] = useState(Boolean(tailor))
  // Autosaves move the head too, so only a head this editor didn't save (restore, AI changes) remounts it.
  const [ownHeads] = useState(() => new Set<string>())
  const [editorKey, setEditorKey] = useState<string | null>(null)
  const head = resume?.headVersionId ?? null
  if (head && head !== editorKey && !ownHeads.has(head)) setEditorKey(head)

  if (isPending) {
    return (
      <div className="grid h-svh gap-4 p-6 lg:grid-cols-2">
        <Skeleton className="h-full" />
        <Skeleton className="h-full" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-medium">{errorMessage(error)}</p>
        <Button variant="outline" asChild>
          <Link to="/workspace">Back to resumes</Link>
        </Button>
      </div>
    )
  }
  return (
    <ResumeEditor
      key={editorKey ?? resume.id}
      resume={resume}
      aiOpen={aiOpen}
      onAiOpenChange={setAiOpen}
      onSaved={(versionId) => ownHeads.add(versionId)}
    />
  )
}

function ResumeEditor({
  resume,
  aiOpen,
  onAiOpenChange,
  onSaved,
}: {
  resume: ResumeDetail
  aiOpen: boolean
  onAiOpenChange: (open: boolean) => void
  onSaved: (versionId: string) => void
}) {
  useCollapsedSidebar()
  const docked = useMediaQuery('(min-width: 1280px)')
  const wide = useMediaQuery('(min-width: 1024px)')
  const showAi = docked && aiOpen
  // Panel widths are remembered per browser, separately with and without the AI panel.
  const layout = useDefaultLayout({
    id: 'resume-editor',
    panelIds: showAi ? ['edit', 'preview', 'ai'] : ['edit', 'preview'],
    storage: panelStorage,
  })
  const queryClient = useQueryClient()
  const structured = resume.mode === 'structured'
  const [content, setContent] = useState<ResumeContent | null>(
    resume.head?.content ?? null,
  )
  const [texSource, setTexSource] = useState(resume.head?.texSource ?? '')
  const [title, setTitle] = useState(resume.title)
  const [templateId, setTemplateId] = useState(resume.templateId ?? 'developer')
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [pane, setPane] = useState<'edit' | 'preview'>('edit')
  const { tailor, created } = Route.useSearch()
  const navigate = useNavigate()
  // A resume made in this visit offers "save as template" on the way out, once it has edits.
  const [editedSinceCreate, setEditedSinceCreate] = useState(false)
  const [offerTemplate, setOfferTemplate] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  // Autosaves add versions without remounting the editor, so track the latest one here.
  const [headVersionId, setHeadVersionId] = useState(resume.headVersionId)
  const [shareOpen, setShareOpen] = useState(false)
  const [aiMode, setAiMode] = useState<AiPanelMode>('tailor')
  const openAi = (mode: AiPanelMode) => {
    setAiMode(mode)
    onAiOpenChange(true)
  }
  const latexEditor = useRef<LatexEditorHandle>(null)
  const lastSaved = useRef(
    JSON.stringify(structured ? resume.head?.content : resume.head?.texSource),
  )

  const preview = usePdfPreview(
    structured ? (content ? { content, templateId } : null) : { texSource },
  )

  const save = useMutation({
    mutationFn: (payload: string) =>
      unwrap(
        api.POST('/v1/resumes/{resumeId}/versions', {
          params: { path: { resumeId: resume.id } },
          body: structured
            ? { kind: 'manual', content: JSON.parse(payload) as ResumeContent }
            : { kind: 'manual', texSource: JSON.parse(payload) as string },
        }),
      ),
    onMutate: () => setSaveState('saving'),
    onSuccess: (version, payload) => {
      lastSaved.current = payload
      if (created) setEditedSinceCreate(true)
      onSaved(version.id)
      setHeadVersionId(version.id)
      setSaveState((state) => (state === 'saving' ? 'saved' : state))
      // Keep the cached head in sync without remounting the editor.
      queryClient.setQueryData(
        queryKeys.resume(resume.id),
        (old: ResumeDetail | undefined) =>
          old ? { ...old, headVersionId: version.id, head: version } : old,
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.versions(resume.id) })
    },
    onError: () => setSaveState('error'),
  })

  const draft = JSON.stringify(structured ? content : texSource)
  useEffect(() => {
    if (draft !== lastSaved.current) setSaveState('unsaved')
  }, [draft])
  useDebouncedEffect(
    () => {
      if (draft !== lastSaved.current && !save.isPending) save.mutate(draft)
    },
    [draft],
    1500,
  )

  const update = useMutation({
    mutationFn: (body: { title?: string; templateId?: string }) =>
      unwrap(
        api.PATCH('/v1/resumes/{resumeId}', {
          params: { path: { resumeId: resume.id } },
          body,
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
    onError: (error) => toast.error(errorMessage(error)),
  })

  const editorPane =
    structured && content ? (
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <ContentEditor value={content} onChange={setContent} />
      </div>
    ) : (
      <LatexEditor
        ref={latexEditor}
        value={texSource}
        onChange={setTexSource}
        errors={preview.errors}
      />
    )
  const previewPane = (
    <PdfPreview
      {...preview}
      pageLimit={resume.pageLimit}
      onErrorClick={
        structured ? undefined : (line) => latexEditor.current?.goToLine(line)
      }
      onFix={structured ? undefined : () => openAi('fix')}
    />
  )
  const aiPanel = (
    <AiPanel
      open={aiOpen}
      onOpenChange={onAiOpenChange}
      docked={docked}
      mode={aiMode}
      resumeId={resume.id}
      initialJobId={tailor ?? resume.jobId}
      content={content}
      texSource={structured ? null : texSource}
      hasUnsavedChanges={saveState !== 'saved'}
    />
  )

  return (
    <div className="flex h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
        <Button variant="ghost" size="icon" asChild>
          <Link
            to="/workspace"
            aria-label="Back to resumes"
            onClick={(event) => {
              if (editedSinceCreate && saveState === 'saved') {
                event.preventDefault()
                setOfferTemplate(true)
              }
            }}
          >
            <ArrowLeftIcon />
          </Link>
        </Button>
        <Input
          aria-label="Resume name"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => {
            const next = title.trim()
            if (!next) setTitle(resume.title)
            else if (next !== resume.title) update.mutate({ title: next })
          }}
          className="h-9 max-w-xs border-transparent bg-transparent px-2 font-medium shadow-none hover:border-input focus-visible:border-input"
        />
        <div className="hidden sm:block">
          <SaveStatus state={saveState} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {structured && (
            <Select
              value={templateId}
              onValueChange={(value) => {
                setTemplateId(value)
                update.mutate({ templateId: value })
              }}
            >
              <SelectTrigger
                className="hidden w-40 md:flex"
                aria-label="Template"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {templateCatalog.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="History"
            onClick={() => setHistoryOpen(true)}
          >
            <HistoryIcon />
          </Button>
          <Button
            variant="outline"
            aria-label="Share"
            onClick={() => setShareOpen(true)}
          >
            <Share2Icon data-icon="inline-start" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <DownloadMenu
            resumeId={resume.id}
            title={title}
            structured={structured}
          />
          <Button
            aria-label="Improve with AI"
            aria-pressed={docked ? aiOpen : undefined}
            onClick={() =>
              docked && aiOpen ? onAiOpenChange(false) : openAi('tailor')
            }
          >
            <SparklesIcon data-icon="inline-start" />
            <span className="hidden sm:inline">Improve with AI</span>
          </Button>
        </div>
      </header>

      <div className="flex shrink-0 justify-center border-b py-2 lg:hidden">
        <Tabs
          value={pane}
          onValueChange={(value) => setPane(value as typeof pane)}
        >
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {wide ? (
        <ResizablePanelGroup
          id="resume-editor"
          defaultLayout={layout.defaultLayout}
          onLayoutChanged={layout.onLayoutChanged}
          className="min-h-0 flex-1"
        >
          <ResizablePanel id="edit" minSize={320} className="overflow-y-auto">
            {editorPane}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel id="preview" minSize={320}>
            {previewPane}
          </ResizablePanel>
          {showAi && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel
                id="ai"
                defaultSize={380}
                minSize={320}
                maxSize={640}
              >
                {aiPanel}
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      ) : (
        <div className="min-h-0 flex-1">
          <div
            className={cn(
              'h-full overflow-y-auto',
              pane === 'preview' && 'hidden',
            )}
          >
            {editorPane}
          </div>
          <div className={cn('h-full', pane === 'edit' && 'hidden')}>
            {previewPane}
          </div>
        </div>
      )}
      {!showAi && aiPanel}
      <UnsavedChangesGuard
        when={saveState === 'unsaved' || saveState === 'saving'}
      />
      <SaveTemplateDialog
        open={offerTemplate}
        onOpenChange={setOfferTemplate}
        resumeId={resume.id}
        defaultName={title}
        title="Also save it as a template?"
        description="Your resume is saved. Keep a copy as a template to start future resumes from it."
        cancelLabel="Not now"
        onDone={() => navigate({ to: '/workspace' })}
      />
      <HistoryPanel
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        resumeId={resume.id}
        headVersionId={headVersionId}
      />
      <SharePanel
        open={shareOpen}
        onOpenChange={setShareOpen}
        resumeId={resume.id}
        headVersionId={headVersionId}
      />
    </div>
  )
}
