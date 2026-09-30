import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  EmptyNote,
  Funnel,
  PlanBadge,
  QueryView,
  Section,
  Stat,
  StatGrid,
  providerLabel,
  displayName,
} from '@/components/admin/admin-ui'
import { BreakdownList } from '@/components/analytics/breakdown-list'
import { ViewsChart } from '@/components/analytics/views-chart'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { adminOverviewQuery } from '@/lib/api/queries'
import type { AdminOverview } from '@/lib/api/types'
import {
  formatInr,
  formatNumber,
  formatUsd,
  initials,
  percent,
  planLabels,
  timeAgo,
} from '@/lib/format'

export const Route = createFileRoute('/_app/admin/')({
  component: OverviewPage,
})

function OverviewPage() {
  const { days = 30 } = Route.useSearch()
  const overview = useQuery(adminOverviewQuery(days))
  return (
    <QueryView query={overview}>{(data) => <Overview data={data} />}</QueryView>
  )
}

const metrics = [
  { key: 'signups', label: 'Sign-ups', unit: ['sign-up', 'sign-ups'] },
  { key: 'resumes', label: 'Resumes', unit: ['resume', 'resumes'] },
  { key: 'aiRuns', label: 'AI runs', unit: ['AI run', 'AI runs'] },
  { key: 'views', label: 'Share views', unit: ['view', 'views'] },
] as const

function Overview({ data }: { data: AdminOverview }) {
  const { totals } = data
  const [metric, setMetric] =
    useState<(typeof metrics)[number]['key']>('signups')
  const selected = metrics.find((m) => m.key === metric)!

  return (
    <div className="flex flex-col gap-10">
      <p className="-mt-4 text-sm text-muted-foreground tabular-nums">
        {formatNumber(totals.users)} people have signed up, plus{' '}
        {formatNumber(totals.guests)} guests. {formatNumber(totals.paidUsers)}{' '}
        on a paid plan, {formatNumber(totals.suspendedUsers)} suspended.
      </p>

      <StatGrid>
        <Stat
          label="New sign-ups"
          value={formatNumber(totals.newUsers)}
          current={totals.newUsers}
          previous={totals.previousNewUsers}
        />
        <Stat
          label="Active users"
          value={formatNumber(totals.activeUsers)}
          current={totals.activeUsers}
          previous={totals.previousActiveUsers}
        />
        <Stat
          label="Resumes created"
          value={formatNumber(totals.resumesCreated)}
          current={totals.resumesCreated}
          previous={totals.previousResumesCreated}
        />
        <Stat
          label="Share views"
          value={formatNumber(totals.shareViews)}
          current={totals.shareViews}
          previous={totals.previousShareViews}
        />
        <Stat
          label="AI runs"
          value={formatNumber(totals.aiRuns)}
          current={totals.aiRuns}
          previous={totals.previousAiRuns}
        />
        <Stat
          label="AI failure rate"
          value={percent(totals.aiFailed, totals.aiRuns)}
          hint={`${formatNumber(totals.aiFailed)} of ${formatNumber(totals.aiRuns)} runs failed`}
        />
        <Stat
          label="AI cost"
          value={formatUsd(totals.aiCostUsdMicros)}
          current={totals.aiCostUsdMicros}
          previous={totals.previousAiCostUsdMicros}
          format={formatUsd}
        />
        <Stat
          label="Revenue"
          value={formatInr(totals.revenuePaise)}
          current={totals.revenuePaise}
          previous={totals.previousRevenuePaise}
          format={formatInr}
        />
      </StatGrid>

      <Section
        title={`${selected.label} per day`}
        actions={
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={metric}
            onValueChange={(value) =>
              value && setMetric(value as typeof metric)
            }
            aria-label="Metric"
            className="flex-wrap"
          >
            {metrics.map((m) => (
              <ToggleGroupItem key={m.key} value={m.key}>
                {m.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      >
        <ViewsChart
          data={data.byDay.map((day) => ({ day: day.day, views: day[metric] }))}
          unit={[...selected.unit]}
        />
      </Section>

      <div className="grid gap-10 md:grid-cols-3">
        <Section
          title="Activation"
          description={`Of the ${formatNumber(data.funnel.signedUp)} who signed up in the last ${data.days} days`}
          className="md:col-span-1"
        >
          <Funnel
            steps={[
              { label: 'Signed up', count: data.funnel.signedUp },
              { label: 'Created a resume', count: data.funnel.createdResume },
              { label: 'Used AI', count: data.funnel.usedAi },
              { label: 'Shared a link', count: data.funnel.shared },
              { label: 'Paid', count: data.funnel.paid },
            ]}
          />
        </Section>
        <BreakdownList
          title="Plans"
          rows={data.plans.map((row) => ({
            label:
              (planLabels as Record<string, string>)[row.label] ?? row.label,
            views: row.count,
          }))}
          empty="No users yet"
        />
        <BreakdownList
          title="Sign-in methods"
          rows={data.providers.map((row) => ({
            label: providerLabel(row.label),
            views: row.count,
          }))}
          empty="No users yet"
        />
      </div>

      <Section
        title="Latest sign-ups"
        actions={
          <Link
            to="/admin/users"
            className="text-sm font-medium text-primary hover:underline"
          >
            All users
          </Link>
        }
      >
        {data.recentSignups.length === 0 ? (
          <EmptyNote>Nobody has signed up yet.</EmptyNote>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {data.recentSignups.map((user) => (
              <li key={user.id}>
                <Link
                  to="/admin/users/$userId"
                  params={{ userId: user.id }}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Avatar className="size-9">
                    {user.image && <AvatarImage src={user.image} alt="" />}
                    <AvatarFallback>
                      {initials(user.name || user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">
                      {displayName(user)}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">
                      {user.email}
                      {user.providers.length > 0 &&
                        ` · ${user.providers.map(providerLabel).join(', ')}`}
                    </span>
                  </span>
                  <PlanBadge plan={user.plan} />
                  <time
                    dateTime={new Date(user.createdAt).toISOString()}
                    className="hidden w-28 shrink-0 text-right text-sm text-muted-foreground sm:block"
                  >
                    {timeAgo(user.createdAt)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}
