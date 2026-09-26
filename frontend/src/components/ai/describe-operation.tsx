import { diffLines } from 'diff'
import type { ResumeContent, SuggestionOperation } from '@/lib/api/types'

type Entry = { id: string; bullets?: { id: string; text: string }[] } & Record<
  string,
  unknown
>

function allEntries(content: ResumeContent) {
  return content.sections.flatMap((section) =>
    'entries' in section
      ? (section.entries as Entry[]).map((entry) => ({ section, entry }))
      : [],
  )
}

function findBulletText(content: ResumeContent, bulletId: string) {
  for (const { entry } of allEntries(content)) {
    const bullet = entry.bullets?.find((b) => b.id === bulletId)
    if (bullet) return bullet.text
  }
  return undefined
}

function labelFor(content: ResumeContent, id: string): string {
  if (id === 'sections') return 'sections'
  const section = content.sections.find((s) => s.id === id)
  if (section) return `the ${section.title} section`
  for (const { entry } of allEntries(content)) {
    if (entry.id === id) {
      const name = [
        entry.organization,
        entry.institution,
        entry.name,
        entry.title,
        entry.role,
      ].find(
        (value): value is string =>
          typeof value === 'string' && value.trim() !== '',
      )
      return name ?? 'an entry'
    }
    const bullet = entry.bullets?.find((b) => b.id === id)
    if (bullet)
      return `“${bullet.text.slice(0, 80)}${bullet.text.length > 80 ? '…' : ''}”`
  }
  const group = content.sections
    .flatMap((s) => (s.type === 'skills' ? s.groups : []))
    .find((g) => g.id === id)
  if (group) return `${group.name} skills`
  return 'an item'
}

// Shows **bold** markers as bold so reviewers see what the resume will look like.
function Rich({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\*\*(.+?)\*\*/g)
        .map((part, index) =>
          index % 2 === 1 ? <b key={index}>{part}</b> : part,
        )}
    </>
  )
}

export function OperationTitle({
  op,
  content,
}: {
  op: SuggestionOperation
  content: ResumeContent | null
}) {
  switch (op.type) {
    case 'update_bullet':
      return <>Rewrite bullet</>
    case 'update_headline':
      return <>Change headline</>
    case 'set_hidden':
      return (
        <>
          {op.hidden ? 'Hide' : 'Show'}{' '}
          {content && op.targetId ? labelFor(content, op.targetId) : 'item'}
        </>
      )
    case 'reorder':
      return (
        <>
          Reorder{' '}
          {content && op.parentId ? labelFor(content, op.parentId) : 'items'}
        </>
      )
    case 'update_skills':
      return (
        <>
          Update{' '}
          {content && op.groupId ? labelFor(content, op.groupId) : 'skills'}
        </>
      )
    case 'replace_source':
      return <>Update the LaTeX</>
  }
}

export function OperationBody({
  op,
  content,
  texSource,
}: {
  op: SuggestionOperation
  content: ResumeContent | null
  texSource: string | null
}) {
  if (op.type === 'update_bullet' && op.text) {
    const before =
      content && op.bulletId ? findBulletText(content, op.bulletId) : undefined
    return (
      <div className="flex flex-col gap-1.5 text-sm">
        {before && (
          <p className="text-muted-foreground line-through decoration-muted-foreground/60">
            <Rich text={before} />
          </p>
        )}
        <p>
          <span className="box-decoration-clone rounded-[2px] bg-highlight/45 px-0.5">
            <Rich text={op.text} />
          </span>
        </p>
      </div>
    )
  }
  if (op.type === 'update_headline' && op.text) {
    return (
      <p className="text-sm">
        {content?.basics.headline && (
          <span className="mr-2 text-muted-foreground line-through">
            {content.basics.headline}
          </span>
        )}
        <span className="rounded-[2px] bg-highlight/45 px-0.5">{op.text}</span>
      </p>
    )
  }
  if (op.type === 'reorder' && op.orderedIds && content) {
    return (
      <ol className="ml-4 list-decimal text-sm text-muted-foreground">
        {op.orderedIds.map((id) => (
          <li key={id}>{labelFor(content, id).replace(/^the /, '')}</li>
        ))}
      </ol>
    )
  }
  if (op.type === 'update_skills' && op.items) {
    return <p className="text-sm">{op.items.join(', ')}</p>
  }
  if (op.type === 'replace_source' && op.texSource && texSource !== null) {
    const changes = diffLines(texSource, op.texSource).filter(
      (part) => part.added || part.removed,
    )
    return (
      <pre className="max-h-72 overflow-auto rounded-md bg-muted p-2 font-mono text-xs leading-5">
        {changes.slice(0, 40).map((part, index) =>
          part.value
            .replace(/\n$/, '')
            .split('\n')
            .map((line, lineIndex) => (
              <div
                key={`${index}-${lineIndex}`}
                className={
                  part.added
                    ? 'bg-highlight/40'
                    : 'text-destructive line-through decoration-destructive/50'
                }
              >
                {part.added ? '+ ' : '- '}
                {line}
              </div>
            )),
        )}
        {changes.length > 40 && (
          <div className="pt-1 text-muted-foreground">
            {changes.length - 40} more changes not shown
          </div>
        )}
      </pre>
    )
  }
  return null
}
