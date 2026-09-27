import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRoundIcon, ShieldCheckIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/app/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { api, errorMessage, expectOk, unwrap } from '@/lib/api/client'
import { aiKeyQuery, queryKeys } from '@/lib/api/queries'
import { formatDate } from '@/lib/format'

type Provider = 'openai' | 'anthropic' | 'openrouter'

const providers: Record<
  Provider,
  {
    name: string
    keysUrl: string
    keyPlaceholder: string
    modelExample: string
  }
> = {
  openai: {
    name: 'OpenAI',
    keysUrl: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-...',
    modelExample: 'gpt-5.4-mini',
  },
  anthropic: {
    name: 'Anthropic',
    keysUrl: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-...',
    modelExample: 'claude-sonnet-5',
  },
  openrouter: {
    name: 'OpenRouter',
    keysUrl: 'https://openrouter.ai/settings/keys',
    keyPlaceholder: 'sk-or-...',
    modelExample: 'anthropic/claude-sonnet-5',
  },
}

export function AiKeyTab() {
  const queryClient = useQueryClient()
  const { data: saved, isPending } = useQuery(aiKeyQuery)
  const [editing, setEditing] = useState(false)
  const [provider, setProvider] = useState<Provider>('openai')
  const [apiKey, setApiKey] = useState('')
  const [modelId, setModelId] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.aiKey })
    queryClient.invalidateQueries({ queryKey: queryKeys.usage })
  }

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        api.PUT('/v1/me/ai-key', {
          body: {
            provider,
            apiKey: apiKey.trim(),
            modelId: modelId.trim() || null,
          },
        }),
      ),
    onSuccess: () => {
      refresh()
      setEditing(false)
      setApiKey('')
      toast.success('Key saved. AI requests now run on your key.')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const remove = useMutation({
    mutationFn: () => expectOk(api.DELETE('/v1/me/ai-key')),
    onSuccess: () => {
      refresh()
      toast.success('Key removed. AI requests use your plan again.')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  if (isPending) return <Skeleton className="h-64" />

  const info = providers[provider]
  const showForm = !saved || editing

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Use your own AI key</CardTitle>
          <CardDescription>
            Tailoring, imports and edits run on your OpenAI, Anthropic or
            OpenRouter account. You pay the provider directly, and your plan's
            AI limits no longer apply.
          </CardDescription>
        </CardHeader>

        {saved && !editing ? (
          <>
            <CardContent>
              <dl className="grid gap-3 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-8">
                <dt className="text-muted-foreground">Provider</dt>
                <dd className="font-medium">
                  {providers[saved.provider].name}
                </dd>
                <dt className="text-muted-foreground">Key</dt>
                <dd className="flex items-center gap-2 font-mono">
                  <KeyRoundIcon className="size-4 text-muted-foreground" />
                  ••••{saved.keyHint}
                </dd>
                <dt className="text-muted-foreground">Model</dt>
                <dd>{saved.modelId ?? 'Default models'}</dd>
                <dt className="text-muted-foreground">Checked</dt>
                <dd>{formatDate(saved.verifiedAt)}</dd>
              </dl>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setProvider(saved.provider)
                  setModelId(saved.modelId ?? '')
                  setEditing(true)
                }}
              >
                Replace key
              </Button>
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmRemove(true)}
              >
                Remove key
              </Button>
            </CardFooter>
          </>
        ) : (
          showForm && (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                save.mutate()
              }}
            >
              <CardContent>
                <FieldGroup className="gap-5">
                  <Field>
                    <FieldLabel htmlFor="ai-provider">Provider</FieldLabel>
                    <Select
                      value={provider}
                      onValueChange={(value) => setProvider(value as Provider)}
                    >
                      <SelectTrigger id="ai-provider" className="w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {(Object.keys(providers) as Provider[]).map((id) => (
                            <SelectItem key={id} value={id}>
                              {providers[id].name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="ai-key">API key</FieldLabel>
                    <Input
                      id="ai-key"
                      type="password"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={info.keyPlaceholder}
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                    />
                    <FieldDescription>
                      Create one in your{' '}
                      <a
                        href={info.keysUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2"
                      >
                        {info.name} dashboard
                      </a>
                      . We test it before saving.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="ai-model">Model (optional)</FieldLabel>
                    <Input
                      id="ai-model"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={info.modelExample}
                      value={modelId}
                      onChange={(event) => setModelId(event.target.value)}
                      className="font-mono"
                    />
                    <FieldDescription>
                      Leave empty to use our recommended {info.name} models.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </CardContent>
              <CardFooter className="mt-6 flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={apiKey.trim().length < 10 || save.isPending}
                >
                  {save.isPending && <Spinner data-icon="inline-start" />}
                  {save.isPending ? 'Testing your key…' : 'Test and save'}
                </Button>
                {editing && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditing(false)
                      setApiKey('')
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </CardFooter>
            </form>
          )
        )}
      </Card>

      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" />
        Your key is encrypted before it's stored. After saving we only ever show
        its last four characters, and it's never included in exports or logs.
        Remove it anytime.
      </p>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Remove your AI key?"
        description="AI requests go back to running on your plan, with its monthly limits."
        confirmLabel="Remove key"
        cancelLabel="Keep it"
        destructive
        onConfirm={() => remove.mutate()}
      />
    </div>
  )
}
