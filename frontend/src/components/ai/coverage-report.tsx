import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { api, unwrap } from '@/lib/api/client'
import type { Coverage } from '@/lib/api/types'

type Requirement = Coverage['mustHave'][number]

function RequirementList({
  title,
  items,
}: {
  title: string
  items: Requirement[]
}) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge
            key={item.requirement}
            variant={item.status === 'covered' ? 'secondary' : 'outline'}
            className={
              item.status === 'missing'
                ? 'text-muted-foreground'
                : item.status === 'in_profile'
                  ? 'border-highlight'
                  : undefined
            }
            title={
              item.status === 'covered'
                ? `Found in ${item.foundIn.join(', ')}`
                : undefined
            }
          >
            {item.requirement}
          </Badge>
        ))}
      </div>
    </div>
  )
}

export function CoverageReport({
  resumeId,
  jobId,
}: {
  resumeId: string
  jobId: string
}) {
  const { data, isPending } = useQuery({
    queryKey: ['resume', resumeId, 'coverage', jobId],
    queryFn: () =>
      unwrap(
        api.GET('/v1/resumes/{resumeId}/coverage', {
          params: { path: { resumeId }, query: { jobId } },
        }),
      ),
  })
  if (isPending) return <Skeleton className="h-24" />
  if (!data) return null

  const all = [...data.mustHave, ...data.niceToHave]
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3">
      <p className="text-sm">
        <span className="font-semibold">
          {data.covered} of {data.total}
        </span>{' '}
        requirements already covered
      </p>
      <RequirementList
        title="Covered"
        items={all.filter((r) => r.status === 'covered')}
      />
      <RequirementList
        title="In your profile, not on this resume"
        items={all.filter((r) => r.status === 'in_profile')}
      />
      <RequirementList
        title="Missing"
        items={all.filter((r) => r.status === 'missing')}
      />
    </div>
  )
}
