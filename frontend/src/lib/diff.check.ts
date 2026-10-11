// Run with: node src/lib/diff.check.ts
import assert from 'node:assert/strict'
import { richWordDiff } from './diff.ts'

const text = (parts: ReturnType<typeof richWordDiff>) =>
  parts
    .map(
      (p) =>
        (p.added ? '+' : p.removed ? '-' : '') +
        p.runs.map((r) => (r.bold ? `[${r.text}]` : r.text)).join(''),
    )
    .join('|')

// Markers never appear, and bold shows on the side it belongs to.
const parts = richWordDiff(
  'Worked on the payouts API',
  'Cut latency of the **payouts API** by 40%',
)
assert.ok(parts.every((p) => p.runs.every((r) => !r.text.includes('**'))))
assert.match(text(parts), /\[payouts API\]/)
// Only bolding changed: the words are unchanged, now shown bold.
assert.equal(
  text(richWordDiff('Built with Kafka', 'Built with **Kafka**')),
  'Built with [Kafka]',
)
// A removed bold word keeps its bold.
assert.match(
  text(richWordDiff('Used **Redis** daily', 'Used Postgres daily')),
  /-\[Redis\]/,
)
// A link shows as its words; its address never appears as a changed word.
const linked = richWordDiff(
  'Ranked 2495 globally',
  'Ranked [2495 globally](https://drive.google.com/x) in the cup',
)
assert.ok(linked.every((p) => p.runs.every((r) => !r.text.includes('drive'))))
assert.match(text(linked), /\+in the cup/)

console.log('diff check ok')
