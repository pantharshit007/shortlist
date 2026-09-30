// Run with: node src/lib/diff.check.ts
import assert from 'node:assert/strict'
import type { ResumeContent } from './api/types'
import { diffContent, lineHunks } from './diff.ts'

const before = {
  basics: { name: 'Asha', headline: 'Backend dev', links: [] },
  sections: [
    {
      id: 's1',
      type: 'experience',
      title: 'Experience',
      hidden: false,
      entries: [
        {
          id: 'e1',
          organization: 'Razorpay',
          role: 'Intern',
          hidden: false,
          bullets: [
            { id: 'b1', text: 'Built APIs', hidden: false },
            { id: 'b2', text: 'Fixed bugs', hidden: false },
            { id: 'b3', text: 'Wrote docs', hidden: false },
          ],
        },
      ],
    },
    {
      id: 's2',
      type: 'skills',
      title: 'Skills',
      hidden: false,
      groups: [{ id: 'g1', name: 'Languages', items: ['Go', 'Java'] }],
    },
  ],
} as ResumeContent

const after = structuredClone(before) as any
const [b1, b2, b3] = after.sections[0].entries[0].bullets
b1.text = 'Built payment APIs'
b3.hidden = true
after.sections[0].entries[0].bullets = [
  b3,
  b1,
  { id: 'b4', text: 'Led demos', hidden: false },
]
after.sections[1].groups[0].items = ['Go', 'Rust']
after.basics.headline = 'Backend engineer'

assert.deepEqual(diffContent(before, before), [], 'no changes')
assert.deepEqual(
  diffContent(before, { ...before, sections: [...before.sections].reverse() }),
  [],
  'order only is not a text change',
)
assert.deepEqual(diffContent(before, after), [
  {
    type: 'text',
    where: 'Headline',
    before: 'Backend dev',
    after: 'Backend engineer',
  },
  { type: 'removed', where: 'Experience, Razorpay, Bullet', text: b2.text },
  {
    type: 'hidden',
    where: 'Experience, Razorpay, Bullet, Wrote docs',
    hidden: true,
  },
  {
    type: 'text',
    where: 'Experience, Razorpay, Bullet',
    before: 'Built APIs',
    after: 'Built payment APIs',
  },
  { type: 'added', where: 'Experience, Razorpay, Bullet', text: 'Led demos' },
  {
    type: 'items',
    where: 'Skills, Languages',
    before: ['Go', 'Java'],
    after: ['Go', 'Rust'],
  },
])

const lines = (n: number) => Array.from({ length: n }, (_, i) => `line ${i}`)
const tex = lines(20)
const edited = [...tex]
edited[10] = 'changed'
const hunks = lineHunks(tex.join('\n') + '\n', edited.join('\n') + '\n')
assert.equal(hunks.length, 1)
assert.deepEqual(
  hunks[0].lines.map((l) => l.sign + l.text),
  [' line 8', ' line 9', '-line 10', '+changed', ' line 11', ' line 12'],
)
assert.equal(hunks[0].oldStart, 9)
console.log('diff check passed')
