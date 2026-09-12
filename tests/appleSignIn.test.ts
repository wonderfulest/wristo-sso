import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { appleCredential, prepareAppleAttempt } from '../src/utils/appleSignIn.ts'

test('each attempt has fresh state and a nonce matching the backend SHA-256 contract', async () => {
  const first = await prepareAppleAttempt()
  const second = await prepareAppleAttempt()
  assert.match(first.state, /^[a-f0-9]{64}$/)
  assert.match(first.nonce, /^[a-f0-9]{64}$/)
  assert.notEqual(first.state, second.state)
  assert.notEqual(first.nonce, second.nonce)
  assert.equal(first.hashedNonce, createHash('sha256').update(first.nonce).digest('hex'))
  assert.deepEqual(appleCredential({ authorization: { state: first.state, id_token: 'signed-token' } }, first),
    { identityToken: 'signed-token', nonce: first.nonce })
})

test('rejects mismatched state and missing tokens before sending credentials', async () => {
  const attempt = await prepareAppleAttempt()
  for (const response of [{}, { authorization: { state: 'wrong', id_token: 'token' } },
    { authorization: { state: attempt.state } }]) {
    assert.throws(() => appleCredential(response, attempt))
  }
})
