import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AlertTriangleIcon, SparklesIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import { api, errorMessage, unwrap } from '@/lib/api/client'
import { queryKeys, usageQuery } from '@/lib/api/queries'
import type { ResumeContent, Suggestion } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { OperationBody, OperationTitle } from './describe-operation'

export function SuggestionReview({
  resumeId,
  suggestion,
  content,
  texSource,
  onApplied,
  onDiscard,
}: {
  resumeId: string
  suggestion: Suggestion
  content: ResumeContent | null
  texSource: string | null
  onApplied: () => void
  onDiscard: () => void
}) {
  const queryClient = useQueryClient()
  const { data: usage } = useQuery(usageQuery)
  // Anything that might add facts the user never gave starts unchecked.
  const [accepted, setAccepted] = useState<Set<string>>(
    () =>
      new Set(
        suggestion.operations
          .filter((op) => op.flags.length === 0)
          .map((op) => op.id),
      ),
  )

  const apply = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST('/v1/resumes/{resumeId}/versions', {
          params: { path: { resumeId } },
          body: {
            kind: 'ai',
            suggestionId: suggestion.id,
            acceptedOperationIds: [...accepted],
          },
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume(resumeId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.versions(resumeId) })
      queryClient.invalidateQueries({
        queryKey: queryKeys.suggestions(resumeId),
      })
      toast.success(
        `${accepted.size} ${accepted.size === 1 ? 'change' : 'changes'} applied`,
      )
      onApplied()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  // Also what a weak model looks like: the server drops changes that point at items that don't exist.
  if (suggestion.operations.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-medium">No changes it could use</p>
          <p className="text-sm text-muted-foreground">
            {usage?.ownAiKey
              ? 'The AI came back without any changes that fit your resume. Try again, or pick a stronger model in your AI provider settings.'
              : 'The AI came back without any changes that fit your resume. Try again, or ask for something more specific.'}
          </p>
        </div>
        {suggestion.summary && (
          <p className="text-sm break-words text-muted-foreground">
            The model said: {suggestion.summary}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onDiscard}>
            Back
          </Button>
          {usage?.ownAiKey && (
            <Button variant="ghost" asChild>
              <Link to="/settings" search={{ tab: 'ai' }}>
                AI provider settings
              </Link>
            </Button>
          )}
        </div>
      </div>
    )
  }

  const toggle = (id: string, checked: boolean) =>
    setAccepted((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {suggestion.summary && (
        <div className="flex flex-col gap-2 pb-4">
          <p className="flex items-start gap-2 text-sm">
            <SparklesIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            {suggestion.summary}
          </p>
        </div>
      )}

      <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {suggestion.operations.map((op) => {
          const checked = accepted.has(op.id)
          const flagged = op.flags.length > 0
          return (
            <li
              key={op.id}
              className={cn(
                'rounded-lg border bg-card p-3 transition-opacity',
                flagged && 'border-destructive/40',
                !checked && 'opacity-60',
              )}
            >
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => toggle(op.id, value === true)}
                  className="mt-0.5"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="text-sm font-medium">
                    <OperationTitle op={op} content={content} />
                  </span>
                  <OperationBody
                    op={op}
                    content={content}
                    texSource={texSource}
                  />
                  <span className="text-xs text-muted-foreground">
                    {op.reason}
                  </span>
                  {flagged && (
                    <span className="flex items-start gap-1.5 text-xs text-destructive">
                      <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
                      {op.flags.join('. ')}. Only accept this if it's true.
                    </span>
                  )}
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center gap-2 border-t pt-4">
        <Button
          onClick={() => apply.mutate()}
          disabled={accepted.size === 0 || apply.isPending}
        >
          {apply.isPending && <Spinner data-icon="inline-start" />}
          Apply {accepted.size} {accepted.size === 1 ? 'change' : 'changes'}
        </Button>
        <Button variant="ghost" onClick={onDiscard}>
          Discard
        </Button>
      </div>
    </div>
  )
}
