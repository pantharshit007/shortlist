import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  EyeIcon,
  LockIcon,
  PinIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { api, errorMessage, expectOk, unwrap } from '@/lib/api/client'
import {
  queryKeys,
  shareLinkStatsQuery,
  shareLinksQuery,
} from '@/lib/api/queries'
import type { ShareLink } from '@/lib/api/types'
import { formatDate, timeAgo } from '@/lib/format'

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label="Copy link"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          toast.error('Could not copy. Select the link and copy it instead.')
        }
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  )
}

function SwitchField({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </Field>
  )
}

function LinkStats({ link }: { link: ShareLink }) {
  const { data } = useQuery(shareLinkStatsQuery(link.id))
  if (!data) return <Skeleton className="h-10" />
  if (data.viewCount === 0)
    return <p className="text-sm text-muted-foreground">No views yet.</p>
  return (
    <dl className="grid grid-cols-3 gap-3 text-sm">
      <div>
        <dt className="text-muted-foreground">Views</dt>
        <dd className="text-lg font-semibold tabular-nums">{data.viewCount}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">People</dt>
        <dd className="text-lg font-semibold tabular-nums">
          {data.uniqueVisitors}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Last viewed</dt>
        <dd className="font-medium">
          {data.lastViewedAt ? timeAgo(data.lastViewedAt) : 'Never'}
        </dd>
      </div>
      {data.topReferrers.length > 0 && (
        <div className="col-span-3">
          <dt className="text-muted-foreground">From</dt>
          <dd>
            {data.topReferrers
              .map(
                (r) =>
                  `${r.referrer === 'direct' ? 'Direct' : r.referrer} (${r.views})`,
              )
              .join(', ')}
          </dd>
        </div>
      )}
    </dl>
  )
}

function LinkCard({ link, resumeId }: { link: ShareLink; resumeId: string }) {
  const queryClient = useQueryClient()
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.shareLinks(resumeId) })
  const update = useMutation({
    mutationFn: (body: { showContact?: boolean; isListed?: boolean }) =>
      unwrap(
        api.PATCH('/v1/share-links/{shareLinkId}', {
          params: { path: { shareLinkId: link.id } },
          body,
        }),
      ),
    onSuccess: refresh,
    onError: (error) => toast.error(errorMessage(error)),
  })
  const remove = useMutation({
    mutationFn: () =>
      expectOk(
        api.DELETE('/v1/share-links/{shareLinkId}', {
          params: { path: { shareLinkId: link.id } },
        }),
      ),
    onSuccess: () => {
      refresh()
      toast.success(
        'Link turned off. Anyone with it now sees a not found page.',
      )
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <li className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <Input
          readOnly
          value={link.url}
          aria-label="Share link"
          className="font-mono text-xs"
          onFocus={(e) => e.target.select()}
        />
        <CopyButton value={link.url} />
        <Button variant="outline" size="icon-sm" asChild>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            aria-label="Open link in a new tab"
          >
            <ExternalLinkIcon />
          </a>
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {link.hasPassword && (
          <Badge variant="secondary">
            <LockIcon data-icon="inline-start" />
            Password
          </Badge>
        )}
        {link.pinnedVersionId && (
          <Badge variant="secondary">
            <PinIcon data-icon="inline-start" />
            Pinned version
          </Badge>
        )}
        {link.expiresAt && (
          <Badge variant="secondary">
            Expires {formatDate(link.expiresAt)}
          </Badge>
        )}
        <Badge variant="outline">
          <EyeIcon data-icon="inline-start" />
          {link.viewCount} {link.viewCount === 1 ? 'view' : 'views'}
        </Badge>
      </div>
      <LinkStats link={link} />
      <Separator />
      <FieldGroup className="gap-4">
        <SwitchField
          id={`${link.id}-contact`}
          label="Show phone and email"
          description="Hidden by default so strangers can't scrape them."
          checked={link.showContact}
          onChange={(showContact) => update.mutate({ showContact })}
        />
        <SwitchField
          id={`${link.id}-listed`}
          label="List on my public profile"
          description="Anyone visiting your profile page can find it."
          checked={link.isListed}
          onChange={(isListed) => update.mutate({ isListed })}
        />
      </FieldGroup>
      <Button
        variant="ghost"
        size="sm"
        className="self-start text-destructive"
        onClick={() => remove.mutate()}
      >
        <Trash2Icon data-icon="inline-start" />
        Turn off this link
      </Button>
    </li>
  )
}

function CreateLinkForm({
  resumeId,
  headVersionId,
  onDone,
}: {
  resumeId: string
  headVersionId: string | null
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [slug, setSlug] = useState('')
  const [showContact, setShowContact] = useState(false)
  const [isListed, setIsListed] = useState(false)
  const [pin, setPin] = useState(false)
  const [password, setPassword] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const create = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST('/v1/resumes/{resumeId}/share-links', {
          params: { path: { resumeId } },
          body: {
            ...(slug.trim() && { slug: slug.trim().toLowerCase() }),
            showContact,
            isListed,
            pinnedVersionId: pin ? headVersionId : null,
            ...(password && { password }),
            ...(expiresAt && {
              expiresAt: new Date(
                `${expiresAt}T23:59:59`,
              ).toISOString() as never,
            }),
          },
        }),
      ),
    onSuccess: async (link) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.shareLinks(resumeId),
      })
      try {
        await navigator.clipboard.writeText(link.url)
        toast.success('Link created and copied')
      } catch {
        toast.success('Link created')
      }
      onDone()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <form
      className="flex flex-col gap-4 rounded-lg border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault()
        create.mutate()
      }}
    >
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="slug">Link name (optional)</FieldLabel>
          <Input
            id="slug"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="razorpay-backend"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <FieldDescription>
            Lowercase letters, numbers and hyphens. We pick one from the resume
            name if you leave it empty.
          </FieldDescription>
        </Field>
        <SwitchField
          id="new-contact"
          label="Show phone and email"
          description="Off by default."
          checked={showContact}
          onChange={setShowContact}
        />
        <SwitchField
          id="new-listed"
          label="List on my public profile"
          description="Off keeps it unlisted."
          checked={isListed}
          onChange={setIsListed}
        />
        <SwitchField
          id="new-pin"
          label="Pin to this exact version"
          description="Off means the link always shows your latest edits."
          checked={pin}
          onChange={setPin}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="link-password">Password (optional)</FieldLabel>
            <Input
              id="link-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="link-expiry">Expires on (optional)</FieldLabel>
            <Input
              id="link-expiry"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </Field>
        </div>
      </FieldGroup>
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={
            create.isPending || (password.length > 0 && password.length < 4)
          }
        >
          {create.isPending && <Spinner data-icon="inline-start" />}
          Create link
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export function SharePanel({
  open,
  onOpenChange,
  resumeId,
  headVersionId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  resumeId: string
  headVersionId: string | null
}) {
  const { data: links, isPending } = useQuery({
    ...shareLinksQuery(resumeId),
    enabled: open,
  })
  const [creating, setCreating] = useState(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Share</SheetTitle>
          <SheetDescription>
            Send a link instead of an attachment. You'll see when it's opened.
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4">
          {creating || (links && links.length === 0) ? (
            <CreateLinkForm
              resumeId={resumeId}
              headVersionId={headVersionId}
              onDone={() => setCreating(false)}
            />
          ) : (
            <Button
              variant="outline"
              className="self-start"
              onClick={() => setCreating(true)}
            >
              <PlusIcon data-icon="inline-start" />
              New link
            </Button>
          )}
          {isPending ? (
            <Skeleton className="h-40" />
          ) : (
            <ul className="flex flex-col gap-4">
              {links?.map((link) => (
                <LinkCard key={link.id} link={link} resumeId={resumeId} />
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
