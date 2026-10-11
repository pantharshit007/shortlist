// Run with: node src/lib/recommend-template.check.ts
import assert from 'node:assert/strict'
import type { ResumeContent } from './api/types.ts'
import { recommendTemplate, yearsOfExperience } from './recommend-template.ts'

const now = new Date('2026-10-11')
const resume = (
  jobs: { role: string; start?: string; end?: string }[],
  headline?: string,
) =>
  ({
    basics: { name: 'A', headline, links: [] },
    sections: [
      {
        id: 'x',
        type: 'experience',
        title: 'Experience',
        hidden: false,
        entries: jobs.map((job, i) => ({
          id: `e${i}`,
          hidden: false,
          organization: 'Co',
          bullets: [],
          ...job,
        })),
      },
    ],
  }) as unknown as ResumeContent
const pick = (content: ResumeContent) =>
  recommendTemplate(content, now).templateId

// 17 years, latest role an architect: the leadership layout, and the reason names both.
const nirav = recommendTemplate(
  resume([
    { role: 'Solution Architect', start: '2021-03', end: 'present' },
    { role: 'Senior Tech Lead', start: '2009-07', end: '2021-02' },
  ]),
  now,
)
assert.equal(nirav.templateId, 'executive')
assert.match(nirav.reason, /17 years.*Solution Architect/)

// A senior title alone, early in a career, isn't enough.
assert.equal(
  pick(
    resume([{ role: 'Software Architect', start: '2023-01', end: 'present' }]),
  ),
  'developer',
)

assert.equal(pick(resume([])), 'campus')
assert.equal(
  pick(resume([{ role: 'SDE Intern', start: '2026-05', end: '2026-07' }])),
  'campus',
)
assert.equal(
  pick(resume([{ role: 'Product Manager', start: '2020-01', end: 'present' }])),
  'product-manager',
)
assert.equal(
  pick(
    resume([{ role: 'Product Designer', start: '2020-01', end: 'present' }]),
  ),
  'designer',
)
assert.equal(
  pick(
    resume([{ role: 'Business Analyst', start: '2021-01', end: 'present' }]),
  ),
  'data-analyst',
)
assert.equal(
  pick(
    resume([
      { role: 'Chartered Accountant', start: '2019-01', end: 'present' },
    ]),
  ),
  'finance',
)
// "AI" in a backend engineer's headline doesn't make them a researcher.
assert.equal(
  pick(
    resume(
      [{ role: 'Backend Engineer', start: '2020-01', end: 'present' }],
      'Backend engineer building AI features',
    ),
  ),
  'developer',
)
// Older jobs in an "Earlier experience" list, and "17+ years" in the summary, both count.
const withEarlier = resume([
  { role: 'Technology Lead', start: '2017-10', end: '2026-02' },
]) as unknown as { sections: unknown[] }
withEarlier.sections.push({
  id: 'l',
  type: 'list',
  title: 'EARLIER EXPERIENCE',
  hidden: false,
  entries: [
    {
      id: 'x',
      hidden: false,
      title: 'Lead Developer',
      date: 'Apr 2008 \u2013 May 2009',
      bullets: [],
    },
  ],
})
assert.equal(
  yearsOfExperience(withEarlier as unknown as ResumeContent, now),
  18,
)
const stated = resume([
  { role: 'Engineer', start: '2022-01', end: 'present' },
]) as unknown as {
  sections: unknown[]
}
stated.sections.push({
  id: 's',
  type: 'summary',
  title: 'Profile',
  hidden: false,
  text: 'Architect with 17+ years in banking.',
})
assert.equal(yearsOfExperience(stated as unknown as ResumeContent, now), 17)
console.log('recommend-template: ok')
