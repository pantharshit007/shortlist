import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'

// How a number moved against the same-length period before it.
export function Change({
  current,
  previous,
  format = (value) => value.toLocaleString('en-IN'),
}: {
  current: number
  previous: number
  format?: (value: number) => string
}) {
  if (previous === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {current === 0 ? 'None yet' : 'None in the period before'}
      </p>
    )
  }
  const change = Math.round(((current - previous) / previous) * 100)
  const Icon = change >= 0 ? ArrowUpIcon : ArrowDownIcon
  return (
    <p className="flex items-center gap-1 text-sm text-muted-foreground">
      <Icon className="size-3.5" aria-hidden />
      <span className="sr-only">{change >= 0 ? 'Up' : 'Down'}</span>
      {Math.abs(change)}% vs the {format(previous)} before
    </p>
  )
}
