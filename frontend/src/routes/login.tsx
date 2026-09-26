import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { MailCheckIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Logo } from '@/components/brand/logo'
import { GitHubIcon, GoogleIcon } from '@/components/auth/provider-icons'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { signIn, useSession } from '@/lib/auth-client'
import { site } from '@/lib/site'

const searchSchema = z.object({
  mode: z.enum(['signin', 'signup']).optional(),
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: `Sign in | ${site.name}` }] }),
  component: LoginPage,
})

// Only same-site paths, so a crafted link can't bounce users to another domain after sign-in.
function safeRedirect(path: string | undefined) {
  return path && path.startsWith('/') && !path.startsWith('//')
    ? path
    : '/dashboard'
}

function LoginPage() {
  const { mode, redirect } = Route.useSearch()
  const navigate = useNavigate()
  const { data: session } = useSession()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [pending, setPending] = useState<'email' | 'google' | 'github' | null>(
    null,
  )
  const isSignup = mode === 'signup'
  const target = safeRedirect(redirect)
  // Read at click time; window doesn't exist while this page renders on the server.
  const callbackURL = () => `${window.location.origin}${target}`

  useEffect(() => {
    if (session) navigate({ to: target })
  }, [session, navigate, target])

  async function withProvider(provider: 'google' | 'github') {
    setPending(provider)
    const { error } = await signIn.social({
      provider,
      callbackURL: callbackURL(),
    })
    if (error) {
      setPending(null)
      toast.error(
        error.status === 404 || error.code === 'PROVIDER_NOT_FOUND'
          ? `${provider === 'google' ? 'Google' : 'GitHub'} sign-in isn't set up yet. Use your email instead.`
          : (error.message ?? 'Could not start sign-in. Try again.'),
      )
    }
  }

  async function withEmail(event: React.FormEvent) {
    event.preventDefault()
    setPending('email')
    const { error } = await signIn.magicLink({
      email,
      ...(name && { name }),
      callbackURL: callbackURL(),
    })
    setPending(null)
    if (error) {
      toast.error(
        error.message ??
          'Could not send the link. Check the email address and try again.',
      )
      return
    }
    setSentTo(email)
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        <main
          id="main"
          tabIndex={-1}
          className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12 outline-none"
        >
          {sentTo ? (
            <div className="flex flex-col gap-4" aria-live="polite">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MailCheckIcon className="size-5" />
              </span>
              <h1 className="text-3xl font-semibold tracking-tight">
                Check your email
              </h1>
              <p className="text-muted-foreground">
                We sent a sign-in link to{' '}
                <span className="font-medium text-foreground">{sentTo}</span>.
                It expires in 5 minutes.
              </p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setSentTo(null)}>
                  Use a different email
                </Button>
                <Button
                  variant="ghost"
                  onClick={(event) => withEmail(event)}
                  disabled={pending === 'email'}
                >
                  {pending === 'email' && <Spinner data-icon="inline-start" />}
                  Send again
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {isSignup ? 'Create your account' : 'Sign in to ' + site.name}
                </h1>
                <p className="text-muted-foreground">
                  {isSignup
                    ? 'Free for 3 resumes. No password to remember.'
                    : 'Welcome back. Pick up where you left off.'}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => withProvider('google')}
                  disabled={pending !== null}
                >
                  {pending === 'google' ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <GoogleIcon data-icon="inline-start" />
                  )}
                  Continue with Google
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => withProvider('github')}
                  disabled={pending !== null}
                >
                  {pending === 'github' ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <GitHubIcon data-icon="inline-start" />
                  )}
                  Continue with GitHub
                </Button>
              </div>

              <form onSubmit={withEmail}>
                <FieldGroup>
                  <FieldSeparator>or use your email</FieldSeparator>
                  {isSignup && (
                    <Field>
                      <FieldLabel htmlFor="name">Your name</FieldLabel>
                      <Input
                        id="name"
                        autoComplete="name"
                        placeholder="Aarav Sharma"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                      />
                    </Field>
                  )}
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      spellCheck={false}
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                    <FieldDescription>
                      We will email you a link to sign in.
                    </FieldDescription>
                  </Field>
                  <Button type="submit" size="lg" disabled={pending !== null}>
                    {pending === 'email' && (
                      <Spinner data-icon="inline-start" />
                    )}
                    Email me a sign-in link
                  </Button>
                </FieldGroup>
              </form>

              <p className="text-sm text-muted-foreground">
                {isSignup ? 'Already have an account? ' : 'New here? '}
                <Link
                  to="/login"
                  search={{ mode: isSignup ? 'signin' : 'signup', redirect }}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  {isSignup ? 'Sign in' : 'Create an account'}
                </Link>
              </p>
              <p className="text-xs text-muted-foreground">
                By continuing you agree to our{' '}
                <Link to="/terms" className="underline underline-offset-2">
                  terms
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="underline underline-offset-2">
                  privacy policy
                </Link>
                .
              </p>
            </div>
          )}
        </main>
      </div>

      <aside
        className="relative hidden overflow-hidden bg-muted lg:block"
        aria-hidden="true"
      >
        <img
          src="/templates/developer.png"
          alt=""
          className="absolute top-16 left-16 w-[125%] max-w-none rotate-[-4deg] rounded-sm shadow-2xl ring-1 ring-black/5"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-muted via-muted/90 to-transparent px-16 pt-32 pb-14">
          <p className="max-w-md font-serif text-2xl leading-snug">
            Paste the job. Review the changes. Send the link.
          </p>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            One master profile, a tailored version for every application, and
            every change waiting for your approval.
          </p>
        </div>
      </aside>
    </div>
  )
}
