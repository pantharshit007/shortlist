import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { UnsavedChangesGuard } from '@/components/app/unsaved-changes-guard'
import { LatexEditor } from '@/components/editor/latex-editor'
import type { LatexEditorHandle } from '@/components/editor/latex-editor'
import { PdfPreview } from '@/components/editor/pdf-preview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCollapsedSidebar } from '@/hooks/use-collapsed-sidebar'
import { usePdfPreview } from '@/hooks/use-pdf-preview'
import { cn } from '@/lib/utils'

export function TemplateEditor<TResult>({
  initialName,
  initialTex,
  saving,
  saveLabel,
  onSave,
  onSaved,
  isNew = false,
}: {
  initialName: string
  initialTex: string
  saving: boolean
  saveLabel: string
  onSave: (template: { name: string; texSource: string }) => Promise<TResult>
  onSaved?: (result: TResult) => void
  isNew?: boolean
}) {
  useCollapsedSidebar()
  const [name, setName] = useState(initialName)
  const [texSource, setTexSource] = useState(initialTex)
  const [saved, setSaved] = useState({
    name: initialName,
    texSource: initialTex,
  })
  const [pane, setPane] = useState<'edit' | 'preview'>('edit')
  const latexEditor = useRef<LatexEditorHandle>(null)
  const preview = usePdfPreview({ texSource })
  const dirty = name !== saved.name || texSource !== saved.texSource
  const [created, setCreated] = useState(!isNew)

  async function save() {
    const next = { name: name.trim() || 'Untitled template', texSource }
    const result = await onSave(next)
    // Clear the unsaved-changes guard before onSaved navigates away.
    flushSync(() => {
      setName(next.name)
      setSaved(next)
      setCreated(true)
    })
    onSaved?.(result)
  }

  return (
    <div className="flex h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/my-templates" aria-label="Back to templates">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <Input
          aria-label="Template name"
          placeholder="Template name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-9 max-w-xs border-transparent bg-transparent px-2 font-medium shadow-none hover:border-input focus-visible:border-input"
        />
        <Button
          className="ml-auto"
          onClick={() => save().catch(() => {})}
          disabled={saving || !texSource.trim() || (created && !dirty)}
        >
          {saving && <Spinner data-icon="inline-start" />}
          {saveLabel}
        </Button>
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

      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <div
          className={cn(
            'min-h-0 min-w-0 overflow-y-auto',
            pane === 'preview' && 'hidden lg:block',
          )}
        >
          <LatexEditor
            ref={latexEditor}
            value={texSource}
            onChange={setTexSource}
            errors={preview.errors}
          />
        </div>
        <div
          className={cn(
            'min-h-0 min-w-0 border-l',
            pane === 'edit' && 'hidden lg:block',
          )}
        >
          <PdfPreview
            {...preview}
            pageLimit={2}
            onErrorClick={(line) => latexEditor.current?.goToLine(line)}
          />
        </div>
      </div>
      <UnsavedChangesGuard when={dirty} />
    </div>
  )
}
