// Run with: node src/lib/ats.check.ts
import assert from 'node:assert/strict'
import type { AtsReport } from './api/types'
import { fixInstruction, sortChecks } from './ats.ts'

const check = (
  id: string,
  status: 'pass' | 'warn' | 'fail',
  fix: string | null,
) => ({
  id,
  label: id,
  status,
  detail: '',
  fix,
})

const report: AtsReport = {
  score: 60,
  grade: 'fair',
  summary: '',
  categories: [
    {
      id: 'a',
      label: 'A',
      score: 5,
      maxScore: 10,
      checks: [
        check('ok', 'pass', 'never sent'),
        check('soft', 'warn', 'Shorten long bullets'),
        check('hard', 'fail', 'Add an email address'),
      ],
    },
    {
      id: 'b',
      label: 'B',
      score: 5,
      maxScore: 10,
      checks: [
        check('dupe', 'fail', 'Add an email address'),
        check('none', 'fail', null),
      ],
    },
  ],
  keywords: null,
  stats: { words: 0, bullets: 0, sections: [], quantifiedBullets: 0 },
}

assert.deepEqual(
  sortChecks(report.categories[0].checks).map((c) => c.status),
  ['fail', 'warn', 'pass'],
)

const text = fixInstruction(report)
assert.ok(text)
assert.equal(
  text.split('\n').length,
  3,
  'one line per unique fix, plus the lead',
)
assert.ok(
  text.indexOf('email') < text.indexOf('Shorten'),
  'failures before warnings',
)
assert.ok(!text.includes('never sent'))

assert.ok(fixInstruction(report, 120)!.length <= 120)
assert.equal(
  fixInstruction({
    ...report,
    categories: [
      { ...report.categories[0], checks: [check('ok', 'pass', 'x')] },
    ],
  }),
  null,
)

console.log('ats ok')
