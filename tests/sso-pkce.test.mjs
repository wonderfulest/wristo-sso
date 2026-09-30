import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'
const challenge = '7UImt-33V5AYkZKihFsphsNiNlyCpgpjrBcU5BdfJpY'
const state = 'a'.repeat(64)
const target = 'https://studio.wristo.io/auth/callback'
const transpile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
async function loadApi(calls) {
  const source = await readFile(new URL('../src/api/auth.ts', import.meta.url), 'utf8')
  const exports = {}
  vm.runInNewContext(transpile(source), { exports, require: () => ({ default: {
    post: async (...args) => { calls.push(args); return { code: 0, data: 'authorization-code' } },
  } }) })
  return exports
}
test('SSO API forwards challenge for token and cookie sessions and retains legacy calls', async () => {
  const calls = []
  const { ssoLogin } = await loadApi(calls)
  for (const token of ['test-token', undefined]) {
    await ssoLogin('studio', target, token, challenge)
    const [path, body, config] = calls.at(-1)
    assert.equal(path, '/sso/login')
    assert.equal(body.codeChallenge, challenge)
    assert.equal(config?.headers.Authorization, token ? `Bearer ${token}` : undefined)
  }
  await ssoLogin('store', 'https://www.wristo.io/auth/callback')
  assert.equal(calls.at(-1)[1].codeChallenge, undefined)
})
async function pageFunction(page, name, context) {
  const source = await readFile(new URL(`../src/views/${page}.vue`, import.meta.url), 'utf8')
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const ast = ts.createSourceFile('page.ts', script, ts.ScriptTarget.Latest, true)
  const node = ast.statements.find(node => node.name?.text === name ||
    (ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.text === name)))
  assert.ok(node, `Missing ${name}`)
  return vm.runInNewContext(transpile(node.getText(ast)).replaceAll('import.meta.env', '{}') + `\n${name}`, context)
}
for (const page of ['Auth', 'Login']) {
  test(`${page} preserves state, code and next on callback`, async () => {
    const calls = []
    const api = await loadApi(calls)
    const context = {
      exports: {}, URL, window: { location: { origin: 'https://sso.wristo.io', href: '' } },
      route: { query: { state, code_challenge: challenge, code_challenge_method: 'S256' } },
      redirectUri: { value: target }, clientId: { value: 'studio' },
      nextPath: { value: '/designs/new-projects' }, ...api,
      ElMessage: { error: msg => { throw new Error(msg) } },
      t: value => value, translateApiMessage: value => value, console,
    }
    const fn = await pageFunction(page, page === 'Auth' ? 'handleSsoRedirect' : 'redirectWithCode', context)
    if (page === 'Auth') await fn('test-token')
    else fn(target, 'authorization-code')
    const callback = new URL(context.window.location.href)
    assert.equal(callback.searchParams.get('state'), state)
    assert.equal(callback.searchParams.get('code'), 'authorization-code')
    assert.equal(callback.searchParams.get('next'), '/designs/new-projects')
    if (page === 'Auth') assert.equal(calls[0][1].codeChallenge, challenge)
  })
}
