import {
  CheckIcon,
  FileCodeIcon,
  FileTextIcon,
  FileUpIcon,
  HistoryIcon,
  LockIcon,
  MessageSquareIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from 'lucide-react'
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useReducedMotion,
} from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Reveal, ease } from '@/components/landing/reveal'
import { cn } from '@/lib/utils'

// Smaller things worth knowing, each shown working. Loops only run while their tile is on screen, and with
// reduced motion every tile shows its finished state.

const tile =
  'flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-card p-6 text-left transition-colors hover:border-[color-mix(in_oklch,var(--border),var(--foreground)_12%)]'
const tileTitle = 'font-serif text-xl font-semibold tracking-[-0.01em]'

// Ticks once per `ms` while the element is on screen, for tiles that loop.
function useLoop(ms: number) {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!inView || reduceMotion) return
    const timer = setInterval(() => setStep((s) => s + 1), ms)
    return () => clearInterval(timer)
  }, [inView, reduceMotion, ms])
  return { ref, step, inView, reduceMotion }
}

const checks = [
  'Contact details found',
  'Standard section headings',
  'One column, reads in order',
  'Numbers in your bullets',
]

function AtsTile() {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, amount: 0.5 })
  const [score, setScore] = useState(reduceMotion ? 82 : 0)
  useEffect(() => {
    if (!seen || reduceMotion) return
    const controls = animate(0, 82, {
      duration: 1.4,
      ease,
      onUpdate: (v) => setScore(Math.round(v)),
    })
    return () => controls.stop()
  }, [seen, reduceMotion])
  const circumference = 2 * Math.PI * 52

  return (
    <article ref={ref} data-reveal className={cn(tile, 'lg:row-span-2')}>
      <ShieldCheckIcon className="size-5 text-primary" />
      <h3 className={cn(tileTitle, 'mt-4')}>Free ATS check, no sign-up</h3>
      <p className="mt-2 text-base text-muted-foreground">
        See how hiring software reads your resume, your score, and exactly what
        to fix.
      </p>
      <div className="mt-8 flex flex-1 flex-col items-center justify-center gap-6">
        <div className="relative size-40" aria-hidden="true">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              strokeWidth="10"
              className="stroke-muted"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className="stroke-primary"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - score / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-4xl font-semibold tabular-nums">
              {score}
            </span>
            <span className="text-sm text-muted-foreground">out of 100</span>
          </div>
        </div>
        <ul className="w-full max-w-xs space-y-2 text-sm">
          {checks.map((check, i) => (
            <motion.li
              key={check}
              initial={reduceMotion ? false : { opacity: 0, x: -6 }}
              animate={seen ? { opacity: 1, x: 0 } : undefined}
              transition={{ delay: 0.4 + i * 0.15, duration: 0.35, ease }}
              className="flex items-center gap-2"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-primary/12 text-primary">
                <CheckIcon className="size-3.5" />
              </span>
              {check}
            </motion.li>
          ))}
        </ul>
      </div>
    </article>
  )
}

function HonestTile() {
  const { ref, step, reduceMotion } = useLoop(3200)
  const flagged = reduceMotion || step % 2 === 1
  return (
    <article ref={ref} data-reveal className={tile}>
      <SparklesIcon className="size-5 text-primary" />
      <h3 className={cn(tileTitle, 'mt-4')}>It never makes things up</h3>
      <p className="mt-2 text-base text-muted-foreground">
        The AI only rewrites what you have done. Anything new is flagged and
        left out.
      </p>
      <div className="mt-5 rounded-2xl border p-3.5 text-sm" aria-hidden="true">
        <p
          className={cn(
            'transition-colors duration-300',
            flagged && 'text-muted-foreground line-through',
          )}
        >
          Led a team of 10 across three cities
        </p>
        <AnimatePresence initial={false}>
          {flagged && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease }}
              className="overflow-hidden text-destructive dark:text-muted-foreground"
            >
              <span className="block pt-1.5">
                Not applied. Your resume never mentions a team.
              </span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </article>
  )
}

const prompt = 'Make every bullet start with a strong action verb'

function ChatTile() {
  const { ref, step, inView, reduceMotion } = useLoop(6000)
  const [typed, setTyped] = useState(reduceMotion ? prompt.length : 0)
  useEffect(() => {
    if (!inView || reduceMotion) return
    setTyped(0)
    let n = 0
    const timer = setInterval(() => {
      n += 1
      setTyped(n)
      if (n >= prompt.length) clearInterval(timer)
    }, 38)
    return () => clearInterval(timer)
  }, [step, inView, reduceMotion])
  const done = typed >= prompt.length

  return (
    <article ref={ref} data-reveal className={cn(tile, 'lg:col-span-2')}>
      <MessageSquareIcon className="size-5 text-primary" />
      <h3 className={cn(tileTitle, 'mt-4')}>Ask for any edit</h3>
      <p className="mt-2 text-base text-muted-foreground">
        Tell the AI what to change in plain words. You see every change before
        it is applied.
      </p>
      <div
        className="mt-5 grid gap-3 text-sm sm:grid-cols-2"
        aria-hidden="true"
      >
        <div className="rounded-2xl bg-muted p-3.5">
          <span className="text-muted-foreground">You</span>
          <p className="mt-1 min-h-10">
            {prompt.slice(0, typed)}
            {!done && (
              <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-foreground align-middle" />
            )}
          </p>
        </div>
        <div className="rounded-2xl border p-3.5">
          <span className="text-muted-foreground">Suggested change</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={done ? 'after' : 'before'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-1"
            >
              {done ? (
                <>
                  <span className="rounded-[2px] bg-highlight/70 px-0.5 dark:bg-highlight/40">
                    Grew
                  </span>{' '}
                  Instagram followers from 9k to 24k in a year
                </>
              ) : (
                <span className="text-muted-foreground">
                  Instagram followers went from 9k to 24k in a year
                </span>
              )}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </article>
  )
}

const files = [
  { name: 'Resume.pdf', icon: FileTextIcon },
  { name: 'main.tex', icon: FileCodeIcon },
  { name: 'resume.txt', icon: FileTextIcon },
]

function ImportTile() {
  const { ref, step, reduceMotion } = useLoop(2200)
  const file = files[step % files.length]
  const Icon = file.icon
  return (
    <article ref={ref} data-reveal className={tile}>
      <FileUpIcon className="size-5 text-primary" />
      <h3 className={cn(tileTitle, 'mt-4')}>Bring the resume you have</h3>
      <p className="mt-2 text-base text-muted-foreground">
        Upload a PDF, your Overleaf .tex file or plain text. Every line stays
        yours to edit.
      </p>
      <div
        className="mt-5 flex h-24 items-center justify-center rounded-2xl border border-dashed text-sm"
        aria-hidden="true"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={file.name}
            initial={reduceMotion ? false : { opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.35, ease }}
            className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 font-medium"
          >
            <Icon className="size-4 text-primary" />
            {file.name}
          </motion.span>
        </AnimatePresence>
      </div>
    </article>
  )
}

function PrivateTile() {
  const { ref, step, reduceMotion } = useLoop(2600)
  const masked = reduceMotion || step % 2 === 1
  const field = (real: string, label: string) => (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={masked ? label : real}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className={cn(
          'inline-block',
          masked &&
            'rounded-md bg-foreground px-1.5 text-xs leading-5 text-background',
        )}
      >
        {masked ? label : real}
      </motion.span>
    </AnimatePresence>
  )
  return (
    <article ref={ref} data-reveal className={tile}>
      <LockIcon className="size-5 text-primary" />
      <h3 className={cn(tileTitle, 'mt-4')}>Private by default</h3>
      <p className="mt-2 text-base text-muted-foreground">
        Your email and phone number are never sent to the AI.
      </p>
      <div className="mt-5 rounded-2xl border p-3.5 text-sm" aria-hidden="true">
        <span className="text-muted-foreground">
          {masked ? 'What the AI sees' : 'Your resume'}
        </span>
        <p className="mt-1.5 font-medium">Neha Kulkarni</p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5">
          {field('neha@example.com', 'email')}
          <span className="text-muted-foreground">|</span>
          {field('+91 90000 00000', 'phone')}
        </p>
      </div>
    </article>
  )
}

const versions = [
  'Imported from PDF',
  'Edited the summary',
  'Tailored for Marketing Executive',
  'Moved skills above education',
]

function HistoryTile() {
  const { ref, step } = useLoop(2400)
  const count = 2 + (step % (versions.length - 1))
  const shown = versions.slice(0, count).reverse()
  return (
    <article ref={ref} data-reveal className={cn(tile, 'lg:col-span-2')}>
      <HistoryIcon className="size-5 text-primary" />
      <h3 className={cn(tileTitle, 'mt-4')}>Every version saved</h3>
      <p className="mt-2 text-base text-muted-foreground">
        Changed your mind? Go back to any earlier version from History.
      </p>
      <ul
        className="mt-5 flex h-[8.25rem] flex-col gap-1.5 overflow-hidden text-sm"
        aria-hidden="true"
      >
        <AnimatePresence initial={false}>
          {shown.map((version, i) => (
            <motion.li
              key={version}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    i === 0 ? 'bg-primary' : 'bg-input',
                  )}
                />
                <span className="truncate">{version}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {i === 0 ? 'Now' : 'Undo'}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </article>
  )
}

export function Bento() {
  return (
    <Reveal
      as="section"
      aria-labelledby="more-features"
      className="mx-auto max-w-6xl px-5 pt-28 text-center"
    >
      <h2
        id="more-features"
        data-reveal
        className="font-serif text-[2rem] leading-[1.05] font-semibold tracking-[-0.02em] sm:text-5xl"
      >
        Small things that save you time
      </h2>
      <p data-reveal className="mx-auto mt-4 max-w-xl text-lg">
        Everything you need to send a resume you trust, in one place.
      </p>
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AtsTile />
        <ChatTile />
        <HonestTile />
        <PrivateTile />
        <ImportTile />
        <HistoryTile />
      </div>
    </Reveal>
  )
}
