import { Link } from '@tanstack/react-router'
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ease } from '@/components/landing/reveal'
import { Button } from '@/components/ui/button'

// The hero: the headline cycles through jobs in many fields, and below it a short recording shows the real app
// importing a resume, tailoring it to a job, reviewing the changes and downloading the PDF.

// The headline keeps its own quicker rhythm, independent of the demo, across many fields.
const titles = [
  'Marketing',
  'Finance',
  'HR',
  'Sales',
  'Operations',
  'Consulting',
  'Design',
  'Data',
  'Software',
]
const firstSwapMs = 1500
const titleMs = 2500

// The job in the headline fades to the next one, and the highlighter marks it, as it marks rewrites below.
function JobTitle({ word }: { word: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={word}
        className="relative inline-block whitespace-nowrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, ease } }}
        exit={{ opacity: 0, transition: { duration: 0.25 } }}
      >
        <motion.span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-[0.1em] -z-10 h-[0.28em] origin-left bg-highlight/80 dark:bg-primary/40"
          initial={{ scaleX: 0 }}
          animate={{
            scaleX: 1,
            transition: { delay: 0.2, duration: 0.5, ease },
          }}
        />
        {word}
      </motion.span>
    </AnimatePresence>
  )
}

export function Hero() {
  const reduceMotion = useReducedMotion()
  const hero = useRef<HTMLElement>(null)
  const onScreen = useInView(hero, { amount: 0.2 })

  // The headline goes through the jobs once and rests back on the first (WCAG 2.2.2).
  const [title, setTitle] = useState(0)
  const swapped = useRef(false)
  useEffect(() => {
    if (reduceMotion || !onScreen || (swapped.current && title === 0)) return
    const timer = setTimeout(
      () => {
        swapped.current = true
        setTitle((t) => (t + 1) % titles.length)
      },
      swapped.current ? titleMs : firstSwapMs,
    )
    return () => clearTimeout(timer)
  }, [title, reduceMotion, onScreen])

  // The recording plays muted while it's on screen and pauses off it; with reduced motion it waits for a click.
  const video = useRef<HTMLVideoElement>(null)
  const videoOnScreen = useInView(video, { amount: 0.4 })
  useEffect(() => {
    const element = video.current
    if (!element || reduceMotion) return
    if (videoOnScreen) element.play().catch(() => {})
    else element.pause()
  }, [videoOnScreen, reduceMotion])

  return (
    <section ref={hero} className="px-5 pt-16 pb-12 text-center sm:pt-24">
      {/* The label keeps one steady name for the page while the job in the line keeps changing. */}
      <h1
        aria-label="Your resume, tailored to every job you apply for"
        className="isolate mx-auto max-w-6xl font-serif text-[2.4rem] leading-[1.04] font-semibold tracking-[-0.035em] sm:text-6xl lg:text-7xl"
      >
        {/* Phones drop "Your resume," so the line and the job each fit on one line. */}
        <span className="max-sm:hidden">Your resume, tailored to every</span>
        <span className="sm:hidden">Tailored to every</span>
        <br />
        <span className="whitespace-nowrap">
          <JobTitle word={titles[title]} /> job
        </span>
      </h1>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
        <Button size="lg" asChild className="h-12 px-7 text-base">
          <Link to="/login" search={{ mode: 'signup' }}>
            Build my resume free
          </Link>
        </Button>
        <Button
          size="lg"
          variant="glass"
          asChild
          className="h-12 px-6 text-base"
        >
          <Link to="/ats-checker">Check my ATS score</Link>
        </Button>
      </div>
      <p className="mx-auto mt-8 max-w-2xl text-lg sm:text-xl">
        Upload your resume and paste the job you want. Our AI tailors it in
        under a minute and shows your ATS match. You keep only the changes you
        like.
      </p>

      <h2 className="mt-20 font-serif text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] sm:text-4xl">
        See it work
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-lg">
        Import a resume, tailor it to a job, review each change and download the
        PDF, in under a minute.
      </p>
      <figure className="mx-auto mt-8 max-w-5xl">
        <video
          ref={video}
          className="aspect-[1280/800] w-full rounded-2xl bg-card shadow-[0_1px_2px_rgb(0_0_0/0.06),0_12px_40px_-12px_rgb(0_0_0/0.25)] ring-1 ring-black/5"
          poster="/video/how-it-works.jpg"
          width={1280}
          height={800}
          muted
          loop
          playsInline
          controls
          preload="metadata"
          aria-describedby="how-it-works-video"
        >
          <source src="/video/how-it-works.webm" type="video/webm" />
          <source src="/video/how-it-works.mp4" type="video/mp4" />
        </video>
        <figcaption id="how-it-works-video" className="sr-only">
          A screen recording of Shortlist: a marketing resume is imported from a
          PDF, the headline is edited, a job description is pasted and the AI
          tailors the resume, each suggested change is reviewed and one is
          skipped, the changes are applied, and the resume is downloaded as a
          PDF.
        </figcaption>
      </figure>
    </section>
  )
}
