import { Link } from '@tanstack/react-router'
import { site } from '@/lib/site'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn('size-7 shrink-0', className)}
    >
      <rect width="32" height="32" rx="7" className="fill-primary" />
      <path
        d="M10 7h9l5 5v13a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"
        className="fill-primary-foreground"
      />
      <path
        d="M19 7v5h5"
        fill="none"
        className="stroke-primary"
        strokeWidth="1.4"
      />
      <rect
        x="12"
        y="15"
        width="9"
        height="2"
        rx="1"
        className="fill-highlight"
      />
      <rect
        x="12"
        y="19"
        width="7"
        height="1.6"
        rx=".8"
        className="fill-primary"
        opacity=".55"
      />
    </svg>
  )
}

export function Logo({
  className,
  to = '/',
}: {
  className?: string
  to?: string
}) {
  return (
    <Link
      to={to}
      className={cn('flex items-center gap-2 rounded-md', className)}
      aria-label={`${site.name} home`}
    >
      <LogoMark />
      <span className="font-serif text-xl font-semibold tracking-tight">
        {site.name}
      </span>
    </Link>
  )
}
