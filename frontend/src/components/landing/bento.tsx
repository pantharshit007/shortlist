import { Link } from '@tanstack/react-router'
import { ArrowRightIcon, CheckIcon, LockIcon, XIcon } from 'lucide-react'
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useReducedMotion,
} from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Reveal, ease } from '@/components/landing/reveal'
import { Button } from '@/components/ui/button'
import { templateCatalog } from '@/lib/templates'
import { cn } from '@/lib/utils'

// Smaller features, each shown working. Loops only run while their tile is on screen, and with reduced
// motion every tile shows its finished state.

const tile =
  'group/tile relative flex min-w-0 flex-col overflow-hidden rounded-[1.75rem] border bg-card p-6 text-left transition-[transform,border-color] duration-300 lg:min-h-60 hover:-translate-y-0.5 hover:border-[color-mix(in_oklch,var(--border),var(--foreground)_14%)] sm:p-7'
const title = 'text-lg leading-snug font-semibold tracking-[-0.01em]'
const body = 'mt-1.5 text-sm text-muted-foreground'

// Ticks once per `ms` while the tile is on screen.
function useLoop(ms: number) {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!inView || reduceMotion) return
    const timer = setInterval(() => setStep((s) => s + 1), ms)
    return () => clearInterval(timer)
  }, [inView, reduceMotion, ms])
  return { ref, step, inView, reduceMotion }
}

// Counts up to `to` the first time the tile is seen.
function useCountUp(to: number, seen: boolean) {
  const reduceMotion = useReducedMotion()
  const [value, setValue] = useState(reduceMotion ? to : 0)
  useEffect(() => {
    if (!seen || reduceMotion) return
    const controls = animate(0, to, {
      duration: 1.4,
      ease,
      onUpdate: (v) => setValue(Math.round(v)),
    })
    return () => controls.stop()
  }, [to, seen, reduceMotion])
  return value
}

const checks = [
  'Contact details found',
  'Standard section headings',
  'One column, reads in order',
  'Numbers in your bullets',
]

// A resume page being read line by line, with the score and checks filling in beside it.
function AtsTile() {
  const reduceMotion = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const seen = useInView(ref, { once: true, amount: 0.4 })
  const score = useCountUp(82, seen)
  const circumference = 2 * Math.PI * 46

  return (
    <article
      ref={ref}
      data-reveal
      className={cn(tile, 'sm:col-span-2 lg:row-span-2')}
    >
      <h3 className={title}>
        Free ATS check.
        <br />
        No sign-up.
      </h3>
      <p className={cn(body, 'max-w-sm')}>
        Upload your PDF and see it the way hiring software reads it: your score,
        and exactly what to fix.
      </p>

      <div className="mt-8 grid flex-1 items-center gap-6 sm:grid-cols-[1fr_auto]">
        <div
          aria-hidden="true"
          className="relative mx-auto h-56 w-full max-w-[15rem] overflow-hidden rounded-xl bg-sheet p-4 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_10px_30px_-12px_rgb(0_0_0/0.2)] ring-1 ring-black/5"
        >
          <div className="mx-auto h-2.5 w-24 rounded-full bg-neutral-800" />
          <div className="mx-auto mt-1.5 h-1.5 w-32 rounded-full bg-neutral-300" />
          {[0, 1, 2].map((block) => (
            <div key={block} className="mt-4">
              <div className="h-1.5 w-14 rounded-full bg-neutral-700" />
              <div className="mt-1 h-px w-full bg-neutral-300" />
              {[92, 80, 86].map((w, i) => (
                <div
                  key={i}
                  className="mt-1.5 h-1.5 rounded-full bg-neutral-200"
                  style={{ width: `${w - block * 6}%` }}
                />
              ))}
            </div>
          ))}
          {!reduceMotion && (
            <motion.div
              className="absolute inset-x-0 h-10 bg-[linear-gradient(to_bottom,transparent,color-mix(in_oklch,var(--primary),transparent_78%),transparent)]"
              initial={{ top: '-15%' }}
              animate={seen ? { top: ['-15%', '100%'] } : undefined}
              transition={{
                duration: 2.6,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatDelay: 0.6,
              }}
            />
          )}
        </div>

        <div className="flex flex-col items-center gap-5 sm:items-start">
          <div className="relative size-36" aria-hidden="true">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                strokeWidth="7"
                className="stroke-muted"
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                strokeWidth="7"
                strokeLinecap="round"
                className="stroke-primary"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - score / 100)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-5xl leading-none font-semibold tracking-[-0.03em] tabular-nums">
                {score}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                ATS score
              </span>
            </div>
          </div>
          <ul className="space-y-1.5 text-sm" aria-hidden="true">
            {checks.map((check, i) => (
              <motion.li
                key={check}
                initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                animate={seen ? { opacity: 1, x: 0 } : undefined}
                transition={{ delay: 0.5 + i * 0.18, duration: 0.35, ease }}
                className="flex items-center gap-2"
              >
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <CheckIcon className="size-3" />
                </span>
                {check}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button size="lg" asChild className="h-11 px-5 text-base">
          <Link to="/ats-checker">
            Check my resume, free
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">
          Takes about 10 seconds
        </span>
      </div>
    </article>
  )
}

const sources = ['PDF', 'Overleaf .tex', 'Plain text', 'Start blank']

function ImportTile() {
  const { ref, step } = useLoop(1400)
  const active = step % sources.length
  return (
    <article ref={ref} data-reveal className={cn(tile, 'sm:col-span-2')}>
      <h3 className={title}>
        Bring the resume
        <br />
        you already have.
      </h3>
      <p className={body}>Every line is read in and stays yours to edit.</p>
      <ul className="mt-auto flex flex-wrap gap-2 pt-8 text-sm">
        {sources.map((source, i) => (
          <li
            key={source}
            className={cn(
              'flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 transition-colors duration-300',
              i === active && 'border-primary/40 bg-primary/8',
            )}
          >
            {source}
            <span
              className={cn(
                'size-1.5 rounded-full transition-colors duration-300',
                i === active ? 'bg-primary' : 'bg-input',
              )}
            />
          </li>
        ))}
      </ul>
    </article>
  )
}

function TemplatesTile() {
  const ref = useRef<HTMLElement>(null)
  const seen = useInView(ref, { once: true, amount: 0.5 })
  const count = useCountUp(templateCatalog.length, seen)
  const thumbs = templateCatalog.slice(0, 3)
  return (
    <article ref={ref} data-reveal className={tile}>
      <span className="font-serif text-6xl leading-none font-semibold tracking-[-0.04em] tabular-nums">
        {count}
      </span>
      <div className="relative mt-4 h-20" aria-hidden="true">
        {thumbs.map((t, i) => (
          <img
            key={t.id}
            src={`/templates/thumbs/${t.id}.webp`}
            alt=""
            loading="lazy"
            width={1020}
            height={1320}
            className="absolute top-0 h-20 w-[3.9rem] rounded-sm bg-sheet object-cover object-top shadow-sm ring-1 ring-black/10 transition-transform duration-300"
            style={{
              left: `${i * 1.6}rem`,
              transform: `rotate(${(i - 1) * 6}deg)`,
            }}
          />
        ))}
      </div>
      <h3 className={cn(title, 'mt-auto pt-4 text-base')}>templates</h3>
      <p className={cn(body, 'mt-0.5')}>One column, easy for ATS to read.</p>
    </article>
  )
}

// The one dark tile: the promise people care most about with AI.
function HonestTile() {
  return (
    <article
      data-reveal
      className={cn(
        tile,
        'border-transparent bg-[#18201d] text-[#f4f1ea] hover:border-transparent dark:border-white/10 dark:bg-[#0c1110] dark:hover:border-white/15',
      )}
    >
      <span className="absolute top-6 right-6 flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 font-mono text-[0.65rem] tracking-wide uppercase sm:top-7 sm:right-7">
        <span className="size-1.5 rounded-full bg-[#f07167]" />
        Not applied
      </span>
      <span className="font-serif text-6xl leading-none font-semibold tracking-[-0.04em]">
        0
      </span>
      <h3 className={cn(title, 'mt-auto pt-10 text-base')}>made-up claims</h3>
      <p className="mt-0.5 text-sm text-[#f4f1ea]/70">
        Anything not in your resume is flagged and left out.
      </p>
    </article>
  )
}

const prompt = 'Make every bullet start with a strong action verb'

function ChatTile() {
  const { ref, step, inView, reduceMotion } = useLoop(6500)
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
    <article ref={ref} data-reveal className={cn(tile, 'sm:col-span-2')}>
      <h3 className={title}>Ask for any edit.</h3>
      <p className={body}>
        Say it in plain words. You see each change before it is applied.
      </p>
      <div className="mt-auto space-y-2 pt-8 text-sm" aria-hidden="true">
        <div className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-primary-foreground">
          {prompt.slice(0, typed)}
          {!done && (
            <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-current align-middle" />
          )}
        </div>
        <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md border bg-background px-3.5 py-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={done ? 'after' : 'before'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="block"
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
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </article>
  )
}

function HistoryTile() {
  const { ref, step, reduceMotion } = useLoop(2600)
  const version = 12 + step
  return (
    <article ref={ref} data-reveal className={tile}>
      <div
        className="flex items-center justify-between font-mono text-[0.65rem] text-muted-foreground"
        aria-hidden="true"
      >
        <span>neha_resume · v{version}</span>
        <span>saved</span>
      </div>
      <div
        className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        <motion.div
          key={version}
          className="h-full origin-left rounded-full bg-foreground"
          initial={reduceMotion ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.6, ease }}
        />
      </div>
      <h3 className={cn(title, 'mt-auto pt-10 text-base')}>
        Every version saved
      </h3>
      <p className={cn(body, 'mt-0.5')}>
        Go back to any earlier version from History.
      </p>
    </article>
  )
}

function OnePageTile() {
  const { ref, step, reduceMotion } = useLoop(2400)
  const fill = reduceMotion ? 0.92 : [0.62, 0.92, 1.06, 0.92][step % 4]
  const over = fill > 1
  return (
    <article ref={ref} data-reveal className={tile}>
      <div className="flex items-end gap-3" aria-hidden="true">
        <div className="relative h-20 w-[3.9rem] overflow-hidden rounded-sm bg-sheet ring-1 ring-black/10">
          <motion.div
            className={cn(
              'absolute inset-x-0 top-0 transition-colors duration-300',
              over ? 'bg-destructive/25' : 'bg-primary/20',
            )}
            animate={{ height: `${Math.min(fill, 1) * 100}%` }}
            transition={{ duration: 0.6, ease }}
          />
        </div>
        <span
          className={cn(
            'mb-0.5 rounded-md px-1.5 py-0.5 font-mono text-[0.65rem] transition-colors duration-300',
            over
              ? 'bg-destructive/10 text-destructive'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {over ? '1 line over' : fill < 0.8 ? 'space left' : '1 page'}
        </span>
      </div>
      <h3 className={cn(title, 'mt-auto pt-10 text-base')}>Fits on one page</h3>
      <p className={cn(body, 'mt-0.5')}>
        Tells you when there is space left or it spills over.
      </p>
    </article>
  )
}

function PrivacyStrip() {
  const { ref, step, reduceMotion } = useLoop(2600)
  const masked = reduceMotion || step % 2 === 1
  const chip = (real: string, label: string) => (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={masked ? label : real}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs',
          masked ? 'bg-foreground text-background' : 'border bg-background',
        )}
      >
        {masked && <XIcon className="size-3" />}
        {masked ? label : real}
      </motion.span>
    </AnimatePresence>
  )
  return (
    <article
      ref={ref}
      data-reveal
      className={cn(
        tile,
        'flex-row flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-4 lg:min-h-0',
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background">
        <LockIcon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold">Private by design.</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Your email and phone number are never sent to the AI. Only people you
          share a link with can see your resume.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5" aria-hidden="true">
        <span className="mr-1 text-xs text-muted-foreground">
          {masked ? 'What the AI sees' : 'Your resume'}
        </span>
        {chip('neha@example.com', 'email')}
        {chip('+91 90000 00000', 'phone')}
      </div>
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
      <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AtsTile />
        <ImportTile />
        <TemplatesTile />
        <HonestTile />
        <ChatTile />
        <HistoryTile />
        <OnePageTile />
        <PrivacyStrip />
      </div>
    </Reveal>
  )
}
