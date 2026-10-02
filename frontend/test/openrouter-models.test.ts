import assert from 'node:assert/strict'
import { afterEach, mock, test } from 'node:test'
import {
  fetchOpenRouterModels,
  filterAiModels,
} from '../src/lib/openrouter-models.ts'

afterEach(() => mock.restoreAll())

test('loads the whole public catalog without pagination, credentials or metadata', async () => {
  const models = Array.from({ length: 465 }, (_, index) => ({
    id: `provider/model-${index}`,
    name: `Model ${index}`,
    pricing: { prompt: '0.01' },
  }))
  mock.method(
    globalThis,
    'fetch',
    async (url: string, options: RequestInit) => {
      assert.equal(url, 'https://openrouter.ai/api/v1/models')
      assert.equal(options.credentials, 'omit')
      assert.equal(options.headers, undefined)
      assert.ok(options.signal instanceof AbortSignal)
      return Response.json({ data: models })
    },
  )
  const result = await fetchOpenRouterModels(new AbortController().signal)
  assert.equal(result.length, 465)
  assert.deepEqual(result[464], { id: 'provider/model-464', name: 'Model 464' })
})

test('reports a failed or malformed catalog so manual model entry remains available', async () => {
  mock.method(
    globalThis,
    'fetch',
    async () => new Response(null, { status: 503 }),
  )
  await assert.rejects(fetchOpenRouterModels(new AbortController().signal))
  mock.method(globalThis, 'fetch', async () =>
    Response.json({ data: [{ name: 'Missing ID' }] }),
  )
  await assert.rejects(fetchOpenRouterModels(new AbortController().signal))
})

test('searches names and IDs across the full catalog, ignoring case and extra spaces', () => {
  const catalog = Array.from({ length: 465 }, (_, index) => ({
    id: `provider/model-${index}`,
    name: `Model ${index}`,
  }))
  catalog.push({ id: 'openai/gpt-6-luna', name: 'OpenAI: GPT-6 Luna' })
  assert.equal(filterAiModels([], catalog, '').length, 466)
  assert.deepEqual(filterAiModels([], catalog, ' GPT   LUNA '), [catalog[465]])
  assert.deepEqual(filterAiModels([], catalog, 'model-464'), [catalog[464]])
  assert.deepEqual(filterAiModels([], catalog, 'nonexistent-model'), [])
})

test('keeps saved models first without duplicating catalog entries, including offline', () => {
  const model = { id: 'saved-model', name: 'Saved model name' }
  assert.deepEqual(
    filterAiModels(['saved-model', 'custom-model', 'saved-model'], [model], ''),
    [model, { id: 'custom-model', name: 'custom-model' }],
  )
  assert.deepEqual(filterAiModels(['custom-model'], [], ' CUSTOM '), [
    { id: 'custom-model', name: 'custom-model' },
  ])
})
