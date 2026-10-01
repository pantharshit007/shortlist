import { CircleCheckIcon, CircleXIcon, TriangleAlertIcon } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
  { label: string; icon: typeof CircleCheckIcon; className: string }
> = {
  fail: {
    label: 'Fail',
    icon: CircleXIcon,
    className: 'bg-destructive/10 text-destructive',
  },
  warn: {
    label: 'Warning',
    icon: TriangleAlertIcon,
    className: 'bg-highlight text-highlight-foreground',
  },
  pass: {
    label: 'Pass',
    icon: CircleCheckIcon,
    className: 'bg-success/10 text-success',
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

// Container queries keep it readable in the editor's narrow AI panel and on the full checker page.
export function AtsReport({ report }: { report: Report }) {
  const grade = grades[report.grade]
  const issues = (checks: Report['categories'][number]['checks']) =>
    checks.filter((check) => check.status !== 'pass').length
  const { stats } = report
  const statList = [
    { label: 'Words', value: stats.words },
    { label: 'Bullets', value: stats.bullets },
    {
      label: 'Bullets with numbers',
      value: `${stats.quantifiedBullets} of ${stats.bullets}`,
    },
    { label: 'Sections found', value: stats.sections.length },
  ]

  return (
    <div className="@container flex flex-col gap-6">
      <div className="flex flex-col gap-4 @sm:flex-row @sm:items-center">
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
          <p className="text-muted-foreground">{report.summary}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border @xl:grid-cols-4">
        {statList.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-0.5 bg-card p-3">
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            <dd className="font-medium tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>
      {stats.sections.length > 0 && (
        <p className="-mt-3 text-sm text-muted-foreground">
          Sections an ATS can find: {stats.sections.join(', ')}
        </p>
      )}

      <section aria-label="Checks" className="flex flex-col">
        <Accordion
          type="multiple"
          defaultValue={report.categories
            .filter((category) => issues(category.checks) > 0)
            .map((category) => category.id)}
          className="rounded-lg border"
        >
          {report.categories.map((category) => {
            const count = issues(category.checks)
            return (
              <AccordionItem
                key={category.id}
                value={category.id}
                className="px-3"
              >
                <AccordionTrigger className="items-center gap-3 py-3 font-sans text-base hover:no-underline">
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-semibold">{category.label}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {count === 0
                        ? 'All checks pass'
                        : `${count} ${count === 1 ? 'thing' : 'things'} to fix`}
                    </span>
                  </span>
                  <span className="text-sm tabular-nums">
                    {category.score}/{category.maxScore}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="flex flex-col gap-3 pb-3">
                    {sortChecks(category.checks).map((check) => (
                      <li
                        key={check.id}
                        className="flex flex-col gap-1.5 rounded-md bg-muted/40 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusLabel status={check.status} />
                          <span className="font-medium">{check.label}</span>
                        </div>
                        <p className="text-muted-foreground">{check.detail}</p>
                        {check.fix && check.status !== 'pass' && (
                          <p>
                            <span className="font-medium">How to fix: </span>
                            {check.fix}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </section>

      {report.keywords && (
        <section aria-labelledby="ats-keywords" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 id="ats-keywords" className="font-sans text-base font-semibold">
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
    </div>
  )
}
