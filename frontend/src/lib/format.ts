const relative = new Intl.RelativeTimeFormat('en-IN', { numeric: 'auto' })
const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

export function timeAgo(value: string | Date) {
  const seconds = (new Date(value).getTime() - Date.now()) / 1000
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size)
      return relative.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

// A fixed time zone keeps server-rendered dates identical to what the browser renders.
const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
})

export function formatDate(value: string | Date) {
  return dateFormat.format(new Date(value))
}

const dateTimeFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
})

export function formatDateTime(value: string | Date) {
  return dateTimeFormat.format(new Date(value))
}

export const planLabels = {
  free: 'Free',
  season_pass: 'Season Pass',
  pro: 'Pro',
} as const

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}
