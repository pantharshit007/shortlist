import type { AtsCheckStatus, AtsReport } from './api/types'

type Check = AtsReport['categories'][number]['checks'][number]

const order: Record<AtsCheckStatus, number> = { fail: 0, warn: 1, pass: 2 }

export function sortChecks(checks: Check[]) {
  return [...checks].sort((a, b) => order[a.status] - order[b.status])
}

// The suggestions API caps an edit instruction at 1000 characters, so lower priority fixes are dropped.
export function fixInstruction(report: AtsReport, limit = 1000) {
  const fixes = new Set(
    sortChecks(report.categories.flatMap((category) => category.checks))
      .filter((check) => check.status !== 'pass' && check.fix)
      .map((check) => check.fix as string),
  )
  if (fixes.size === 0) return null
  let text =
    'Fix these ATS issues using only facts already in my resume. Never invent numbers or experience:'
  for (const fix of fixes) {
    const line = `\n- ${fix}`
    if (text.length + line.length > limit) break
    text += line
  }
  return text
}
