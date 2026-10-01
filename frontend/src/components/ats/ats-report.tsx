import { CircleCheckIcon, CircleXIcon, TriangleAlertIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { AtsCheckStatus, AtsReport as Report } from '@/lib/api/types'
import { sortChecks } from '@/lib/ats'
import { cn } from '@/lib/utils'

const grades: Record<Report['grade'], { label: string; ring: string }> = {
  excellent: { label: 'Excellent', ring: 'text-success' },
  good: { label: 'Good', ring: 'text-success' },
  fair: { label: 'Fair', ring: 'text-highlight' },
  poor: { label: 'Needs work', ring: 'text-destructive' },
}

const statuses: Record<
  AtsCheckStatus,
  {
    label: string
    icon: typeof CircleCheckIcon
    className: string
    iconClassName: string
  }
> = {
  fail: {
    label: 'Fail',
    icon: CircleXIcon,
    className: 'bg-destructive/10 text-destructive',
    iconClassName: 'text-destructive',
  },
  warn: {
    label: 'Warning',
    icon: TriangleAlertIcon,
    className: 'bg-highlight text-highlight-foreground',
    iconClassName: 'text-foreground',
  },
  pass: {
    label: 'Pass',
    icon: CircleCheckIcon,
    className: 'bg-success/10 text-success',
    iconClassName: 'text-success',
  },
}

function ScoreRing({ score, className }: { score: number; className: string }) {
  const circumference = 2 * Math.PI * 42
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="size-full -rotate-90">
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        strokeWidth="9"
        className="stroke-muted"
      />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        strokeWidth="9"
        strokeLinecap="round"
        stroke="currentColor"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - score / 100)}
        className={cn('transition-[stroke-dashoffset] duration-700', className)}
      />
    </svg>
  )
}

function StatusLabel({ status }: { status: AtsCheckStatus }) {
  const { label, icon: Icon, className } = statuses[status]
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium',
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {label}
    </span>
  )
}

function KeywordList({
  title,
  words,
  missing,
}: {
  title: string
  words: string[]
  missing?: boolean
}) {
  if (words.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-sans text-sm font-medium">
        {title} <span className="text-muted-foreground">({words.length})</span>
      </h4>
      <ul className="flex flex-wrap gap-1.5">
        {words.map((word) => (
          <li key={word}>
            <Badge
              variant={missing ? 'outline' : 'secondary'}
              className="h-6 text-sm font-normal"
            >
              {word}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Two columns when there's room (the checker page), one in the editor's narrow AI panel.
// `aside` goes under the score, for actions like downloading or importing.
export function AtsReport({
  report,
  aside,
}: {
  report: Report
  aside?: React.ReactNode
}) {
  const grade = grades[report.grade]
  const { stats } = report
  const toFix = report.categories.flatMap((category) =>
    sortChecks(category.checks)
      .filter((check) => check.status !== 'pass')
      .map((check) => ({ ...check, category: category.label })),
  )
  const statList = [
    { label: 'Words', value: stats.words },
    { label: 'Bullets', value: stats.bullets },
    {
      label: 'With numbers',
      value: `${stats.quantifiedBullets} of ${stats.bullets}`,
    },
    { label: 'Sections', value: stats.sections.length },
  ]

  return (
    <div className="@container">
      <div className="grid gap-8 @3xl:grid-cols-[17rem_minmax(0,1fr)] @3xl:items-start">
        <div className="flex flex-col gap-5 @3xl:sticky @3xl:top-24 print:static">
          <div className="flex items-center gap-4 @3xl:flex-col @3xl:items-start">
            <div className="relative size-28 shrink-0">
              <ScoreRing score={report.score} className={grade.ring} />
              <p className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                <span className="font-serif text-4xl font-semibold tabular-nums">
                  {report.score}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  out of 100
                </span>
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="font-sans text-xl font-semibold">{grade.label}</p>
              <p className="text-sm text-muted-foreground">
                {/* The summary starts with the grade, which is already shown above it. */}
                {report.summary.replace(/^\w[\w ]*:\s*/, '')}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border">
            {statList.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col gap-0.5 bg-card p-3"
              >
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                <dd className="font-medium tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
          {stats.sections.length > 0 && (
            <p className="-mt-2 text-sm text-muted-foreground">
              Sections an ATS can find: {stats.sections.join(', ')}
            </p>
          )}
          {aside}
        </div>

        <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="ats-to-fix" className="flex flex-col gap-3">
            <h3 id="ats-to-fix" className="font-sans text-lg font-semibold">
              {toFix.length === 0
                ? 'Nothing to fix'
                : `What to fix (${toFix.length})`}
            </h3>
            {toFix.length === 0 ? (
              <p className="text-muted-foreground">
                Every check passes. An ATS should read this resume cleanly.
              </p>
            ) : (
              <ol className="flex flex-col divide-y rounded-lg border bg-card">
                {toFix.map((check) => (
                  <li
                    key={`${check.category}-${check.id}`}
                    className="flex flex-col gap-1.5 p-4 break-inside-avoid"
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <StatusLabel status={check.status} />
                      <span className="font-medium">{check.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {check.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {check.detail}
                    </p>
                    {check.fix && (
                      <p className="text-sm">
                        <span className="font-medium">How to fix: </span>
                        {check.fix}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {report.keywords && (
            <section
              aria-labelledby="ats-keywords"
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <h3
                  id="ats-keywords"
                  className="font-sans text-lg font-semibold"
                >
                  Job keywords
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add the missing ones only where they are true for you.
                </p>
              </div>
              <KeywordList
                title="Missing"
                words={report.keywords.missing}
                missing
              />
              <KeywordList title="Found" words={report.keywords.matched} />
            </section>
          )}

          <section
            aria-labelledby="ats-breakdown"
            className="flex flex-col gap-3"
          >
            <h3 id="ats-breakdown" className="font-sans text-lg font-semibold">
              Score breakdown
            </h3>
            <ul className="grid gap-3 @lg:grid-cols-2">
              {report.categories.map((category) => (
                <li
                  key={category.id}
                  className="flex flex-col gap-3 rounded-lg border bg-card p-4 break-inside-avoid"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{category.label}</span>
                    <span className="text-sm tabular-nums">
                      {category.score}/{category.maxScore}
                    </span>
                  </div>
                  <span
                    aria-hidden
                    className="h-1.5 overflow-hidden rounded-full bg-muted"
                  >
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{
                        width: `${(category.score / Math.max(1, category.maxScore)) * 100}%`,
                      }}
                    />
                  </span>
                  <ul className="flex flex-col gap-1.5 text-sm">
                    {sortChecks(category.checks).map((check) => {
                      const {
                        icon: Icon,
                        label,
                        iconClassName,
                      } = statuses[check.status]
                      return (
                        <li key={check.id} className="flex items-center gap-2">
                          <Icon
                            aria-hidden
                            className={cn('size-4 shrink-0', iconClassName)}
                          />
                          <span className="sr-only">{label}: </span>
                          <span
                            className={
                              check.status === 'pass'
                                ? 'text-muted-foreground'
                                : undefined
                            }
                          >
                            {check.label}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
