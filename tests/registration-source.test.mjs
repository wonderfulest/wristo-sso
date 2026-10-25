import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
const source = await readFile(new URL('../src/utils/ssoClient.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { registrationSource, resolveSsoClientId } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
test('registration entry follows the product context', () => {
  assert.equal(registrationSource('?client=studio'), 'studio')
  assert.equal(registrationSource('?client=store'), 'store')
  assert.equal(registrationSource('?client=cn'), 'cn')
  assert.equal(registrationSource('?client=store&redirect_uri=https://studio.wristo.io/auth/callback'), 'studio')
  assert.equal(registrationSource('?client=unknown'), 'sso')
  assert.equal(registrationSource(''), 'sso')
})

test('image client resolves production and local callbacks without falling back to store', () => {
  assert.equal(resolveSsoClientId('image', 'https://image.wristo.io/auth/callback'), 'image')
  assert.equal(resolveSsoClientId(undefined, 'http://127.0.0.1:3007/auth/callback'), 'image')
  assert.equal(registrationSource('?client=image'), 'image')
})
