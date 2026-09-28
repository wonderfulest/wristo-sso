import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
const source = await readFile(
  new URL('../src/utils/xiaohongshuPolling.ts', import.meta.url),
  'utf8',
)
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText
const { createXiaohongshuPolling } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
)

function harness(poll) {
  const scheduled = [],
    statuses = [],
    errors = []
  let now = 0
  const runner = createXiaohongshuPolling({
    poll,
    onStatus: (value) => statuses.push(value),
    onError: (error) => errors.push(error),
    now: () => now,
    schedule: (callback, delay) => {
      scheduled.push({ callback, delay })
      return scheduled.length
    },
    cancel: () => {},
  })
  return {
    runner,
    scheduled,
    statuses,
    errors,
    advance: (value) => {
      now += value
    },
  }
}
test('obeys provider intervals and stops on authorization', async () => {
  const replies = [
    { status: 'scanned', interval: 6 },
    { status: 'authorized', interval: 6 },
  ]
  const h = harness(async () => replies.shift())
  h.runner.start(1, 600)
  assert.equal(h.scheduled[0].delay, 1000)
  await h.scheduled[0].callback()
  assert.equal(h.scheduled[1].delay, 6000)
  await h.scheduled[1].callback()
  assert.deepEqual(h.statuses, ['scanned', 'authorized'])
  assert.equal(h.scheduled.length, 2)
})
test('cancel ignores an in-flight response', async () => {
  let resolve
  const h = harness(
    () =>
      new Promise((r) => {
        resolve = r
      }),
  )
  h.runner.start(1, 600)
  const pending = h.scheduled[0].callback()
  h.runner.stop()
  resolve({ status: 'authorized', interval: 1 })
  await pending
  assert.deepEqual(h.statuses, [])
})
test('expires locally and never polls past the QR deadline', async () => {
  let calls = 0
  const h = harness(async () => {
    calls++
    return { status: 'pending', interval: 1 }
  })
  h.runner.start(1, 1)
  h.advance(1000)
  await h.scheduled[0].callback()
  assert.equal(calls, 0)
  assert.deepEqual(h.statuses, ['expired'])
})
test('denial and network failure are terminal', async () => {
  const h = harness(async () => ({ status: 'denied', interval: 1 }))
  h.runner.start(1, 600)
  await h.scheduled[0].callback()
  assert.deepEqual(h.statuses, ['denied'])
  assert.equal(h.scheduled.length, 1)
  const failed = harness(async () => {
    throw new Error('network')
  })
  failed.runner.start(1, 600)
  await failed.scheduled[0].callback()
  assert.equal(failed.errors[0].message, 'network')
  assert.equal(failed.scheduled.length, 1)
})
