import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
const source = await readFile(new URL('../src/utils/cnLogin.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { parseCnLogin, challenge } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
const query = { client: 'cn', redirect_uri: 'https://wristo.cn/auth/callback', state: 'a'.repeat(64), code_challenge: 'b'.repeat(43), code_challenge_method: 'S256' }
test('WeChat start sends only fields accepted by the backend Attempt contract', async () => {
  const vm = await import('node:vm')
  const view = await readFile(new URL('../src/views/CnAuth.vue', import.meta.url), 'utf8')
  const script = view.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const ast = ts.createSourceFile('CnAuth.ts', script, ts.ScriptTarget.Latest, true)
  const start = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'startWechat')
  const code = ts.transpileModule(start.getText(ast), {}).outputText
  for (const inWechat of [false, true]) {
    let request, location, saved
    const context = { clientId: 'cn', redirectUri: query.redirect_uri, state: query.state, codeChallenge: query.code_challenge }
    const sandbox = {
      context: { value: context }, busy: { value: false }, error: { value: '' }, inWechat,
      ATTEMPT_KEY: 'attempt', randomVerifier: () => 'c'.repeat(64), challenge,
      sessionStorage: { setItem: (_, value) => { saved = JSON.parse(value) } },
      cnRequest: async (url, body) => { request = { url, body }; return { authorizationUrl: 'https://open.weixin.qq.com/connect/qrconnect' } },
      window: { location: { assign: value => { location = value } } },
      fail: error => { throw error },
    }
    await vm.runInNewContext(`${code}\nstartWechat()`, sandbox)
    assert.equal(request.url, '/auth/wechat/start')
    assert.deepEqual(JSON.parse(JSON.stringify(request.body)), {
      channel: inWechat ? 'official-account' : 'website', browserState: 'c'.repeat(64),
      browserChallenge: await challenge('c'.repeat(64)), redirectUri: query.redirect_uri,
      state: query.state, codeChallenge: query.code_challenge,
    })
    assert.deepEqual(saved.context, context)
    assert.equal(location, 'https://open.weixin.qq.com/connect/qrconnect')
  }
})
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

test('Studio requires its own exact callback and PKCE state', () => {
  const studio = { ...query, client: 'studio', redirect_uri: 'https://studio.wristo.io/auth/callback' }
  assert.equal(parseCnLogin(studio).clientId, 'studio')
  assert.equal(parseCnLogin({ ...studio, redirect_uri: 'http://localhost:3004/auth/callback' }).clientId, 'studio')
  for (const redirect_uri of [query.redirect_uri, 'https://studio.wristo.io.evil.test/auth/callback', 'http://localhost:3008/auth/callback']) {
    assert.throws(() => parseCnLogin({ ...studio, redirect_uri }))
  }
  assert.throws(() => parseCnLogin({ ...query, redirect_uri: studio.redirect_uri }))
  assert.throws(() => parseCnLogin({ ...studio, code_challenge: '' }))
})

test('password and code sign-in exchange their token for the correct PKCE client', async () => {
  const { default: vm } = await import('node:vm')
  const apiSource = await readFile(new URL('../src/api/cnAuth.ts', import.meta.url), 'utf8')
  const output = ts.transpileModule(apiSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const calls = []
  const exports = {}
  let token = 'email-session'
  vm.runInNewContext(output, { exports, Error, require: name => name === 'axios' ? { default: {
    create: () => ({ request: async config => {
      calls.push(config)
      return { data: { code: 200, data: config.url === '/sso/login' ? 'authorization-code' : { token } } }
    } }),
    isAxiosError: () => false,
  } } : { translateApiMessage: value => value } })
  const context = { clientId: 'cn', redirectUri: query.redirect_uri, codeChallenge: query.code_challenge }
  assert.equal(await exports.passwordSignIn(context, 'member@example.com', ' pass word '), 'authorization-code')
  assert.equal(calls[0].url, '/public/auth/login/email')
  assert.equal(calls[0].data.password, ' pass word ')
  assert.equal(calls[0].headers, undefined)
  assert.equal(calls[1].headers.Authorization, 'Bearer email-session')
  assert.equal(calls[1].data.codeChallenge, query.code_challenge)
  assert.equal(calls[1].data.redirectUri, query.redirect_uri)
  await exports.emailSignIn({ ...context, clientId: 'studio' }, 'member@example.com', '123456')
  assert.equal(calls[2].url, '/auth/email/verify-code')
  assert.equal(calls[2].data.code, '123456')
  assert.equal(calls[2].headers['X-Registration-Source'], 'studio')
  assert.equal(calls[3].data.clientId, 'studio')
  await exports.emailSignIn({ ...context, clientId: 'dashboard', redirectUri: 'https://dashboard.wristo.cn/auth/callback' }, 'admin@example.com', '123456')
  assert.equal(calls[4].headers['X-Registration-Source'], 'dashboard')
  assert.equal(calls[5].data.clientId, 'dashboard')
  assert.equal(calls[5].data.redirectUri, 'https://dashboard.wristo.cn/auth/callback')
  token = ''
  await assert.rejects(() => exports.passwordSignIn(context, 'member@example.com', 'password'), /登录失败/)
  assert.equal(calls.length, 7)
})

 test('CN Studio permits only its exact production and development callbacks', () => {
  const studio = { ...query, client: 'studio' }
  for (const redirect_uri of ['https://studio.wristo.cn/auth/callback', 'http://localhost:5190/auth/callback', 'http://127.0.0.1:5190/auth/callback']) {
    assert.equal(parseCnLogin({ ...studio, redirect_uri }).redirectUri, redirect_uri)
  }
  for (const redirect_uri of ['https://studio.wristo.cn.evil.test/auth/callback', 'https://studio.wristo.cn/auth/callback?next=x', 'https://studio.wristo.cn:5190/auth/callback', 'http://localhost:5191/auth/callback']) {
    assert.throws(() => parseCnLogin({ ...studio, redirect_uri }))
  }
})


test('Dashboard accepts only its CN production and port 3009 callbacks', () => {
  const dashboard = { ...query, client: 'dashboard' }
  for (const redirect_uri of ['https://dashboard.wristo.cn/auth/callback', 'http://localhost:3009/auth/callback', 'http://127.0.0.1:3009/auth/callback']) {
    assert.equal(parseCnLogin({ ...dashboard, redirect_uri }).clientId, 'dashboard')
  }
  for (const redirect_uri of ['https://dashboard.wristo.io/auth/callback', 'https://dashboard.wristo.cn.evil.test/auth/callback', 'https://dashboard.wristo.cn/auth/callback?next=x', 'http://dashboard.wristo.cn/auth/callback', 'https://user@dashboard.wristo.cn/auth/callback', 'http://localhost:3008/auth/callback', 'http://localhost:3002/auth/callback', 'https://studio.wristo.cn/auth/callback']) {
    assert.throws(() => parseCnLogin({ ...dashboard, redirect_uri }))
  }
  assert.throws(() => parseCnLogin({ ...dashboard, redirect_uri: 'https://dashboard.wristo.cn/auth/callback', code_challenge_method: 'plain' }))
  assert.throws(() => parseCnLogin({ ...query, redirect_uri: 'https://dashboard.wristo.cn/auth/callback' }))
})
