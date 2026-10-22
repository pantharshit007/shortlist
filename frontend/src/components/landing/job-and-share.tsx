import {
  CheckIcon,
  EyeIcon,
  LinkIcon,
  LockIcon,
  MapPinIcon,
  Share2Icon,
  TimerIcon,
} from 'lucide-react'
import { Reveal } from '@/components/landing/reveal'
import { cn } from '@/lib/utils'

// The two things the recording above doesn't show: reading a job from its link, and sharing the resume as a
// link. They sit on a desk photo that fades into the page at both ends. The photo is always dark, so text
// here uses fixed light colours rather than the theme's.
const glass =
  'min-w-0 rounded-3xl border border-white/12 bg-[rgb(18_20_18/0.55)] p-6 text-left shadow-[0_24px_60px_-30px_rgb(0_0_0/0.6)] backdrop-blur-xl sm:p-8'
const panel =
  'mt-6 rounded-2xl bg-card p-4 text-sm text-card-foreground shadow-[0_8px_24px_-12px_rgb(0_0_0/0.5)]'

const asks = [
  { skill: 'Instagram', found: true },
  { skill: 'Influencer marketing', found: true },
  { skill: 'Google Analytics', found: true },
  { skill: 'Paid social', found: false },
]

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
        on ? 'justify-end bg-primary' : 'justify-start bg-input',
      )}
    >
      <span className="size-4 rounded-full bg-primary-foreground" />
    </span>
  )
}

export function JobAndShare() {
  return (
    <section
      aria-labelledby="job-and-share"
      className="relative mt-20 overflow-hidden"
    >
      <img
        src="/images/desk.webp"
        srcSet="/images/desk-1000.webp 1000w, /images/desk.webp 2000w"
        sizes="100vw"
        alt=""
        width={2000}
        height={1333}
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--background)_0%,rgb(16_18_16/0.74)_16%,rgb(16_18_16/0.8)_84%,var(--background)_100%)]"
      />
      <Reveal className="relative mx-auto max-w-6xl px-5 py-28 text-center text-[#f4f1ea] sm:py-36">
        <h2
          id="job-and-share"
          data-reveal
          className="font-serif text-[2rem] leading-[1.05] font-semibold tracking-[-0.02em] sm:text-5xl"
        >
          Read the job. Send one link.
        </h2>
        <p
          data-reveal
          className="mx-auto mt-4 max-w-xl text-lg text-[#f4f1ea]/80"
        >
          The two steps around tailoring that take the most time when you apply,
          done for you.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <article data-reveal className={glass}>
            <span className="flex size-11 items-center justify-center rounded-xl bg-white/10">
              <LinkIcon className="size-5" />
            </span>
            <h3 className="mt-5 font-serif text-2xl font-semibold">
              Paste a job link, we read the job
            </h3>
            <p className="mt-2 text-base text-[#f4f1ea]/80">
              Drop in a link from any job site. Shortlist pulls out the role,
              the must-have skills and the requirements, and shows which ones
              your resume already covers.
            </p>
            <div className={panel} aria-hidden="true">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5">
                <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  linkedin.com/jobs/view/marketing-executive
                </span>
                <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Read job
                </span>
              </div>
              <p className="mt-4 font-medium">
                Marketing Executive, Beauty e-commerce, Mumbai
              </p>
              <p className="mt-3 text-muted-foreground">Must-haves</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {asks.map(({ skill, found }) => (
                  <li
                    key={skill}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2.5 py-1',
                      found
                        ? 'bg-primary/12 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {found && <CheckIcon className="size-3.5" />}
                    {skill}
                    {!found && ' (not on your resume)'}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Skills covered</span>
                <span className="font-medium tabular-nums">3 of 4</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-3/4 rounded-full bg-primary" />
              </div>
              <p className="mt-3 flex items-center gap-2 text-muted-foreground">
                <CheckIcon className="size-4 text-success" />1 to 2 years of
                experience: met, about 1.5 years from your dates
              </p>
            </div>
          </article>

          <article data-reveal className={glass}>
            <span className="flex size-11 items-center justify-center rounded-xl bg-white/10">
              <Share2Icon className="size-5" />
            </span>
            <h3 className="mt-5 font-serif text-2xl font-semibold">
              Send one link, not an attachment
            </h3>
            <p className="mt-2 text-base text-[#f4f1ea]/80">
              Your link always shows your latest version, so you never resend a
              file. See when it was opened and from where, and keep your phone
              and email private.
            </p>
            <div className={panel} aria-hidden="true">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5">
                <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  shortlist.co.in/neha/marketing
                </span>
                <span className="rounded-md border px-2 py-0.5 text-xs font-medium">
                  Copy
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="min-w-0 rounded-lg border p-3">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <EyeIcon className="size-4" />
                    Opened
                  </dt>
                  <dd className="mt-1 text-base font-medium sm:text-lg">
                    12 times
                  </dd>
                </div>
                <div className="min-w-0 rounded-lg border p-3">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPinIcon className="size-4" />
                    Last opened
                  </dt>
                  <dd className="mt-1 text-base font-medium sm:text-lg">
                    LinkedIn, Mumbai
                  </dd>
                </div>
              </dl>
              <ul className="mt-4 flex flex-col gap-3">
                <li className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <EyeIcon className="size-4 text-muted-foreground" />
                    Phone and email hidden
                  </span>
                  <Toggle on />
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <LockIcon className="size-4 text-muted-foreground" />
                    Unlock contacts with a password
                  </span>
                  <Toggle on={false} />
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <TimerIcon className="size-4 text-muted-foreground" />
                    Link expires after this season
                  </span>
                  <Toggle on />
                </li>
              </ul>
            </div>
          </article>
        </div>
      </Reveal>
    </section>
  )
}
