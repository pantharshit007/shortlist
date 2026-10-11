// Run with: node src/lib/recommend-template.check.ts
// A labelled set of real-world profiles and the template each should get. Add a row whenever a real resume
// gets a recommendation you disagree with.
import assert from 'node:assert/strict'
import type { ResumeContent } from './api/types.ts'
import { recommendTemplate, yearsOfExperience } from './recommend-template.ts'

const now = new Date('2026-10-11')
type Job = { role: string; start?: string; end?: string }
const resume = (
  jobs: Job[],
  {
    headline,
    skills = [],
    extra = [],
  }: { headline?: string; skills?: string[]; extra?: object[] } = {},
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
      {
        id: 'k',
        type: 'skills',
        title: 'Skills',
        hidden: false,
        groups: [{ id: 'g', name: 'Skills', items: skills }],
      },
      ...extra,
    ],
  }) as unknown as ResumeContent
const since = (year: string) => ({ start: year, end: 'present' })

const golden: [string, ResumeContent, string][] = [
  // Engineers, at any level, keep the developer layout.
  [
    'SDE-1, 1 year',
    resume([{ role: 'Software Engineer 1', ...since('2025-08') }]),
    'developer',
  ],
  [
    'SDE intern, fresher',
    resume([{ role: 'SDE Intern', start: '2026-05', end: '2026-07' }]),
    'developer',
  ],
  [
    'Fresher with a developer headline',
    resume([], { headline: 'Full Stack Developer' }),
    'developer',
  ],
  [
    'Backend engineer, 4 years',
    resume([{ role: 'Backend Engineer', ...since('2022-06') }]),
    'developer',
  ],
  [
    'Senior software engineer, 9 years',
    resume([{ role: 'Senior Software Engineer', ...since('2017-06') }]),
    'developer',
  ],
  [
    'TCS Associate Consultant who codes',
    resume([{ role: 'Associate Consultant', ...since('2022-07') }], {
      skills: ['Java', 'Spring', 'SQL'],
    }),
    'developer',
  ],
  [
    'Infosys Technology Analyst',
    resume([{ role: 'Technology Analyst', ...since('2021-07') }]),
    'developer',
  ],
  [
    'Growth engineer',
    resume([{ role: 'Growth Engineer', ...since('2023-01') }]),
    'developer',
  ],
  [
    'Developer with "growth mindset" headline',
    resume([{ role: 'Developer', ...since('2023-01') }], {
      headline: 'Developer with a growth mindset',
    }),
    'developer',
  ],
  [
    'ML engineer',
    resume([{ role: 'ML Engineer', ...since('2022-01') }]),
    'developer',
  ],
  [
    'C++ developer with an analyst title',
    resume([{ role: 'Analyst', ...since('2023-01') }], {
      skills: ['C++', 'Linux'],
    }),
    'developer',
  ],
  [
    'Software architect, 3 years',
    resume([{ role: 'Software Architect', ...since('2023-01') }]),
    'developer',
  ],
  [
    'Backend engineer whose headline mentions AI',
    resume([{ role: 'Backend Engineer', ...since('2020-01') }], {
      headline: 'Backend engineer building AI features',
    }),
    'developer',
  ],
  // Senior people get the leadership layout.
  [
    'Solution architect, 17 years',
    resume([
      { role: 'Solution Architect', start: '2021-03', end: 'present' },
      { role: 'Senior Tech Lead', start: '2009-07', end: '2021-02' },
    ]),
    'executive',
  ],
  [
    'Engineering manager, 16 years',
    resume([{ role: 'Engineering Manager', ...since('2010-01') }]),
    'executive',
  ],
  [
    'Director, 10 years',
    resume([{ role: 'Director of Engineering', ...since('2016-01') }]),
    'executive',
  ],
  // Other fields.
  ['Student, no jobs', resume([]), 'campus'],
  [
    'Marketing intern, fresher',
    resume([{ role: 'Marketing Intern', start: '2026-05', end: '2026-07' }]),
    'campus',
  ],
  [
    'Product manager',
    resume([{ role: 'Product Manager', ...since('2020-01') }]),
    'product-manager',
  ],
  [
    'Product designer',
    resume([{ role: 'Product Designer', ...since('2020-01') }]),
    'designer',
  ],
  [
    'Business analyst',
    resume([{ role: 'Business Analyst', ...since('2021-01') }]),
    'data-analyst',
  ],
  [
    'Chartered accountant',
    resume([{ role: 'Chartered Accountant', ...since('2019-01') }]),
    'finance',
  ],
  [
    'Strategy consultant, no code',
    resume([{ role: 'Consultant', ...since('2021-01') }], {
      skills: ['Excel', 'PowerPoint'],
    }),
    'consulting',
  ],
  [
    'Marketing manager',
    resume([{ role: 'Marketing Manager', ...since('2020-01') }]),
    'marketing',
  ],
  [
    'Research scientist',
    resume([{ role: 'Research Scientist', ...since('2021-01') }]),
    'ml-research',
  ],
]

const wrong = golden.flatMap(([name, content, expected]) => {
  const got = recommendTemplate(content, now).templateId
  return got === expected ? [] : [`${name}: expected ${expected}, got ${got}`]
})
assert.deepEqual(wrong, [])

// The reason names the years and a senior role.
assert.match(
  recommendTemplate(golden[13][1], now).reason,
  /17 years.*Solution Architect/,
)

// Older jobs in an "Earlier experience" list, and "17+ years" in the summary, both count.
const earlier = resume(
  [{ role: 'Technology Lead', start: '2017-10', end: '2026-02' }],
  {
    extra: [
      {
        id: 'l',
        type: 'list',
        title: 'EARLIER EXPERIENCE',
        hidden: false,
        entries: [
          {
            id: 'x',
            hidden: false,
            title: 'Lead Developer',
            date: 'Apr 2008 – May 2009',
            bullets: [],
          },
        ],
      },
    ],
  },
)
assert.equal(yearsOfExperience(earlier, now), 18)
const stated = resume([{ role: 'Engineer', ...since('2022-01') }], {
  extra: [
    {
      id: 's',
      type: 'summary',
      title: 'Profile',
      hidden: false,
      text: 'Architect with 17+ years in banking.',
    },
  ],
})
assert.equal(yearsOfExperience(stated, now), 17)

console.log(`recommend-template: ${golden.length} profiles ok`)
