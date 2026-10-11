import type { ResumeContent } from '@/lib/api/types'
import type { TemplateId } from '@/lib/templates'

export type TemplateRecommendation = { templateId: TemplateId; reason: string }

const monthsOf = (date: string | undefined, now: Date) => {
  if (date === 'present') return now.getFullYear() * 12 + now.getMonth()
  const [year, month] = (date ?? '').split('-').map(Number)
  return year ? year * 12 + (month ? month - 1 : 0) : null
}

// First job to latest end, so overlapping roles aren't counted twice. Older jobs often sit in a list like
// "Earlier experience" with only a written date, and "17+ years" in the summary beats a resume that lists less.
export function yearsOfExperience(content: ResumeContent, now = new Date()) {
  const visible = content.sections.filter((section) => !section.hidden)
  const spans = visible
    .flatMap((section) =>
      section.type === 'experience' ? section.entries : [],
    )
    .flatMap((entry) => {
      const start = monthsOf(entry.start, now)
      const end = monthsOf(entry.end ?? entry.start, now)
      return start === null || end === null ? [] : [{ start, end }]
    })
  const listedYears = visible
    .flatMap((section) =>
      section.type === 'list' && /experience|employment/i.test(section.title)
        ? section.entries
        : [],
    )
    .flatMap((entry) => (entry.date ?? '').match(/\b(19|20)\d{2}\b/g) ?? [])
    .map((year) => Number(year) * 12)
  const starts = [...spans.map((s) => s.start), ...listedYears]
  const ends = [...spans.map((s) => s.end), ...listedYears]
  const worked = starts.length
    ? Math.round((Math.max(...ends) - Math.min(...starts)) / 12)
    : 0
  const said = [
    content.basics.headline ?? '',
    ...visible.map((section) =>
      section.type === 'summary' ? section.text : '',
    ),
  ]
    .join(' ')
    .match(/\b(\d{1,2})\+?\s*(?:years|yrs)\b/i)
  return Math.max(0, worked, said ? Number(said[1]) : 0)
}

// Checked in order; the first match wins. Titles are what the person did, so they decide over skills.
const byRole: [RegExp, TemplateId, string][] = [
  [/\b(designer|ux|ui\/ux)\b/, 'designer', 'design'],
  [
    /\bproduct (manager|owner|lead)\b|\bapm\b/,
    'product-manager',
    'product management',
  ],
  [
    /\b(investment bank\w*|m&a|equity research|private equity|ib analyst)\b/,
    'banking',
    'investment banking',
  ],
  [
    /\b(accountant|chartered accountant|audit\w*|tax|controller|financial analyst|finance)\b/,
    'finance',
    'finance and accounting',
  ],
  [/\b(consultant|consulting)\b/, 'consulting', 'consulting'],
  [
    /\b(marketing|sales|growth|brand|business development|account executive|seo)\b/,
    'marketing',
    'marketing and sales',
  ],
  [
    /\b(machine learning|ml engineer|research\w*|scientist|phd|publications)\b/,
    'ml-research',
    'machine learning and research',
  ],
  [
    /\b(data|business|bi) analyst\b|\banalytics\b/,
    'data-analyst',
    'data and analytics',
  ],
]

const seniorRole =
  /\b(architect|director|vp|vice president|head|chief|cto|ceo|cfo|coo|principal|general manager|partner)\b/

// Picks a starting template from what the resume already says, so an architect with 17 years doesn't start
// from a student's layout. The person can still choose any other.
export function recommendTemplate(
  content: ResumeContent,
  now = new Date(),
): TemplateRecommendation {
  const years = yearsOfExperience(content, now)
  const roles = content.sections
    .flatMap((section) =>
      section.type === 'experience' && !section.hidden ? section.entries : [],
    )
    .map((entry) => entry.role)
  const senior = roles.find((role) => seniorRole.test(role.toLowerCase()))
  if (years >= 15 || (senior && years >= 8))
    return {
      templateId: 'executive',
      reason: senior
        ? `${years} years of experience and senior roles like ${senior}.`
        : `${years} years of experience.`,
    }

  if (roles.length === 0 || years < 1)
    return {
      templateId: 'campus',
      reason: 'Made for students and freshers, with education first.',
    }

  const text = [
    content.basics.headline ?? '',
    ...roles,
    ...content.sections.map((section) => section.title),
  ]
    .join(' | ')
    .toLowerCase()
  const match = byRole.find(([pattern]) => pattern.test(text))
  if (match)
    return {
      templateId: match[1],
      reason: `Your experience is in ${match[2]}.`,
    }
  return {
    templateId: 'developer',
    reason: 'The layout most people in tech use.',
  }
}
