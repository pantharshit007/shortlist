import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CheckIcon, CopyIcon, DownloadIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/app/confirm-dialog'
import { z } from 'zod'
import { PageHeader } from '@/components/app/page-header'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebouncedEffect } from '@/hooks/use-debounced-effect'
import { api, errorMessage, expectOk, unwrap } from '@/lib/api/client'
import {
  meQuery,
  queryKeys,
  subscriptionQuery,
  usageQuery,
} from '@/lib/api/queries'
import type { Me } from '@/lib/api/types'
import { signOut } from '@/lib/auth-client'
import { downloadFile } from '@/lib/download'
import { formatDate, planLabels } from '@/lib/format'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { site } from '@/lib/site'
import { cn } from '@/lib/utils'

const searchSchema = z.object({
  tab: z.enum(['account', 'billing', 'data']).optional(),
  plan: z.enum(['season_pass', 'pro']).optional(),
})

export const Route = createFileRoute('/_app/settings')({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: `Settings | ${site.name}` }] }),
  component: SettingsPage,
})

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/

function AccountTab({ me }: { me: Me }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(me.name)
  const [username, setUsername] = useState(me.username)
  const [availability, setAvailability] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle')
  const normalized = username.trim().toLowerCase()
  const validFormat = USERNAME_PATTERN.test(normalized)
  const changedUsername = normalized !== me.username

  useEffect(
    () => setAvailability(changedUsername && validFormat ? 'checking' : 'idle'),
    [changedUsername, validFormat, normalized],
  )
  useDebouncedEffect(
    () => {
      if (!changedUsername || !validFormat) return
      unwrap(
        api.GET('/v1/usernames/{username}', {
          params: { path: { username: normalized } },
        }),
      )
        .then((result) =>
          setAvailability(result.available ? 'available' : 'taken'),
        )
        .catch(() => setAvailability('idle'))
    },
    [normalized],
    400,
  )

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        api.PATCH('/v1/me', {
          body: {
            ...(name.trim() !== me.name && { name: name.trim() }),
            ...(changedUsername && { username: normalized }),
          },
        }),
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.me, updated)
      toast.success('Account updated')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const profileUrl = `${site.url}/${me.username}`
  const dirty = name.trim() !== me.name || changedUsername
  const canSave =
    dirty &&
    name.trim() !== '' &&
    (!changedUsername || availability === 'available')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>
          Your username is part of every share link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field
            data-invalid={
              changedUsername && (!validFormat || availability === 'taken')
            }
          >
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <InputGroup>
              <InputGroupAddon>{site.displayDomain}/</InputGroupAddon>
              <InputGroupInput
                id="username"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                aria-invalid={
                  changedUsername && (!validFormat || availability === 'taken')
                }
                onChange={(e) => setUsername(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                {availability === 'checking' && <Spinner />}
                {availability === 'available' && (
                  <CheckIcon className="text-success" />
                )}
                {availability === 'taken' && (
                  <XIcon className="text-destructive" />
                )}
              </InputGroupAddon>
            </InputGroup>
            {changedUsername && !validFormat ? (
              <FieldError>
                Use 3 to 30 lowercase letters, numbers or hyphens.
              </FieldError>
            ) : availability === 'taken' ? (
              <FieldError>That username is taken.</FieldError>
            ) : (
              <FieldDescription>
                {changedUsername
                  ? 'Links with your old username keep working and redirect here.'
                  : 'Lowercase letters, numbers and hyphens.'}
              </FieldDescription>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" value={me.email} disabled />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-url">Public profile</FieldLabel>
            <InputGroup>
              <InputGroupInput id="profile-url" readOnly value={profileUrl} />
              <InputGroupAddon align="inline-end">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Copy profile link"
                  onClick={() =>
                    navigator.clipboard.writeText(profileUrl).then(
                      () => toast.success('Link copied'),
                      () =>
                        toast.error('Could not copy. Select the link instead.'),
                    )
                  }
                >
                  <CopyIcon />
                </Button>
              </InputGroupAddon>
            </InputGroup>
            <FieldDescription>
              Shows the resumes you choose to list.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Button
          disabled={!canSave || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending && <Spinner data-icon="inline-start" />}
          Save changes
        </Button>
      </CardFooter>
    </Card>
  )
}

const paidPlans = [
  {
    id: 'season_pass',
    name: 'Season Pass',
    price: '₹499 for 6 months',
    body: 'One payment. Unlimited resumes and 40 tailored versions a month.',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹129 a month',
    body: 'Same limits, billed monthly. Cancel anytime.',
  },
] as const

function UsageRow({
  label,
  used,
  limit,
}: {
  label: string
  used: number
  limit: number
}) {
  const unlimited = limit >= 1000
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {used} of {unlimited ? 'unlimited' : limit}
        </span>
      </div>
      {!unlimited && (
        <Progress
          value={Math.min(100, (used / limit) * 100)}
          aria-label={label}
        />
      )}
    </div>
  )
}

function BillingTab({
  me,
  highlight,
}: {
  me: Me
  highlight?: 'season_pass' | 'pro'
}) {
  const queryClient = useQueryClient()
  const { data: usage } = useQuery(usageQuery)
  const { data: subscription } = useQuery(subscriptionQuery)
  const [waiting, setWaiting] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.subscription })
    queryClient.invalidateQueries({ queryKey: queryKeys.usage })
    queryClient.invalidateQueries({ queryKey: queryKeys.me })
  }

  const checkout = useMutation({
    mutationFn: async (plan: 'season_pass' | 'pro') => {
      const session = await unwrap(
        api.POST('/v1/checkouts', { body: { plan } }),
      )
      await openRazorpayCheckout({
        key: session.keyId,
        name: site.name,
        description: plan === 'pro' ? 'Pro, monthly' : 'Season Pass, 6 months',
        ...(session.orderId && { order_id: session.orderId }),
        ...(session.razorpaySubscriptionId && {
          subscription_id: session.razorpaySubscriptionId,
        }),
        prefill: { name: me.name, email: me.email },
        theme: { color: '#0b6e65' },
        handler: () => {
          // The plan switches when Razorpay's webhook reaches us, usually within seconds.
          setWaiting(true)
          toast.success('Payment received. Activating your plan…')
          let tries = 0
          const timer = setInterval(() => {
            refresh()
            if (++tries >= 10) {
              clearInterval(timer)
              setWaiting(false)
            }
          }, 2000)
        },
      })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const cancel = useMutation({
    mutationFn: () => unwrap(api.DELETE('/v1/subscription')),
    onSuccess: () => {
      refresh()
      toast.success(
        'Pro cancelled. You keep it until the end of this billing period.',
      )
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const activeSub = subscription?.subscription
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {planLabels[me.plan]} plan
            {waiting && <Spinner />}
          </CardTitle>
          <CardDescription>
            {activeSub?.currentPeriodEnd
              ? activeSub.status === 'cancelled'
                ? `Cancelled. Active until ${formatDate(activeSub.currentPeriodEnd)}.`
                : activeSub.plan === 'pro'
                  ? `Renews on ${formatDate(activeSub.currentPeriodEnd)}.`
                  : `Active until ${formatDate(activeSub.currentPeriodEnd)}.`
              : 'Usage resets on the 1st of every month.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usage ? (
            <div className="flex flex-col gap-4">
              <UsageRow
                label="Resumes"
                used={usage.resumes.used}
                limit={usage.resumes.limit}
              />
              <UsageRow
                label="Tailored versions this month"
                used={usage.tailor.used}
                limit={usage.tailor.limit}
              />
              <UsageRow
                label="AI edits this month"
                used={usage.edit.used}
                limit={usage.edit.limit}
              />
              <UsageRow
                label="Imports this month"
                used={usage.import.used}
                limit={usage.import.limit}
              />
            </div>
          ) : (
            <Skeleton className="h-32" />
          )}
        </CardContent>
        {activeSub?.plan === 'pro' && activeSub.status === 'active' && (
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmCancel(true)}
              disabled={cancel.isPending}
            >
              {cancel.isPending && <Spinner data-icon="inline-start" />}
              Cancel Pro
            </Button>
          </CardFooter>
        )}
        <ConfirmDialog
          open={confirmCancel}
          onOpenChange={setConfirmCancel}
          title="Cancel Pro?"
          description="You keep Pro until the end of the period you've paid for, then move to the Free plan. Nothing is deleted."
          confirmLabel="Cancel Pro"
          cancelLabel="Keep Pro"
          destructive
          onConfirm={() => cancel.mutate()}
        />
      </Card>

      {me.plan === 'free' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {paidPlans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                highlight === plan.id && 'border-primary ring-1 ring-primary',
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {plan.id === 'season_pass' && <Badge>Most popular</Badge>}
                </CardTitle>
                <CardDescription>{plan.price}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {plan.body}
              </CardContent>
              <CardFooter>
                <Button
                  variant={plan.id === 'season_pass' ? 'default' : 'outline'}
                  onClick={() => checkout.mutate(plan.id)}
                  disabled={checkout.isPending}
                >
                  {checkout.isPending && checkout.variables === plan.id && (
                    <Spinner data-icon="inline-start" />
                  )}
                  {plan.id === 'season_pass' ? 'Get the Season Pass' : 'Go Pro'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function DataTab({ me }: { me: Me }) {
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState('')
  const [exporting, setExporting] = useState(false)

  const remove = useMutation({
    mutationFn: () => expectOk(api.DELETE('/v1/me')),
    onSuccess: async () => {
      await signOut().catch(() => undefined)
      toast.success('Your account and data have been deleted.')
      navigate({ to: '/' })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  async function exportData() {
    setExporting(true)
    try {
      await downloadFile('/v1/me/data', 'my-data.json')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Download your data</CardTitle>
          <CardDescription>
            Your account, profile, every resume and version, jobs and share
            links, as one JSON file.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={exportData} disabled={exporting}>
            {exporting ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <DownloadIcon data-icon="inline-start" />
            )}
            Download my data
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
          <CardDescription>
            Deletes your account, resumes, versions, uploaded files and share
            links. Share links stop working immediately. This can't be undone.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <AlertDialog onOpenChange={() => setConfirm('')}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete my account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  Type{' '}
                  <span className="font-medium text-foreground">
                    {me.username}
                  </span>{' '}
                  to confirm. Any active Pro subscription is cancelled too.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                aria-label="Your username"
                autoComplete="off"
                spellCheck={false}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Keep my account</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={confirm !== me.username || remove.isPending}
                  onClick={(event) => {
                    event.preventDefault()
                    remove.mutate()
                  }}
                >
                  {remove.isPending && <Spinner data-icon="inline-start" />}
                  Delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  )
}

function SettingsPage() {
  const { tab = 'account', plan } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data: me } = useQuery(meQuery)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-8 sm:px-8">
      <PageHeader title="Settings" />
      <Tabs
        value={tab}
        onValueChange={(value) =>
          navigate({ search: { tab: value as typeof tab } })
        }
        className="gap-6"
      >
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="billing">Plan and billing</TabsTrigger>
          <TabsTrigger value="data">Your data</TabsTrigger>
        </TabsList>
        {!me ? (
          <Skeleton className="h-80" />
        ) : (
          <>
            <TabsContent value="account">
              <AccountTab key={me.username} me={me} />
            </TabsContent>
            <TabsContent value="billing">
              <BillingTab me={me} highlight={plan} />
            </TabsContent>
            <TabsContent value="data">
              <DataTab me={me} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
