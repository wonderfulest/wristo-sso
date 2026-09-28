import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
const source = await readFile(new URL('../src/utils/cnLogin.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { parseCnLogin, challenge } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
const query = { client: 'cn', redirect_uri: 'https://wristo.cn/auth/callback', state: 'a'.repeat(64), code_challenge: 'b'.repeat(43), code_challenge_method: 'S256' }
test('only exact CN callbacks and S256 are accepted', () => {
  assert.equal(parseCnLogin(query).redirectUri, query.redirect_uri)
  for (const redirect_uri of ['https://wristo.cn.evil.test/auth/callback', 'https://evil.test/auth/callback', 'https://wristo.cn/auth/callback?next=x', 'https://user@wristo.cn/auth/callback', 'http://wristo.cn/auth/callback']) {
    assert.throws(() => parseCnLogin({ ...query, redirect_uri }))
  }
  assert.throws(() => parseCnLogin({ ...query, code_challenge_method: 'plain' }))
  assert.throws(() => parseCnLogin({ ...query, state: '' }))
})
test('PKCE matches RFC 7636 test vector', async () => {
  assert.equal(await challenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
})
