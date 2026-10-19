import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('../src/i18n.ts', import.meta.url), 'utf8')
const exports = {}
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, {
  exports,
  require: name => {
    if (name === 'vue') return {}
    if (name === '@/store/locale') return { getStoredLocale: () => 'en' }
    throw new Error(`Unexpected import: ${name}`)
  },
})
const { translateApiMessage } = exports

test('preserves the backend password-login failure reason', () => {
  assert.equal(translateApiMessage('Email or password is incorrect'), 'Email or password is incorrect')
})

test('preserves other specific backend errors even with a page fallback', () => {
  assert.equal(translateApiMessage('  Account access is temporarily restricted  ', 'auth.loginFailed'), 'Account access is temporarily restricted')
})

test('retains translations for recognized errors', () => {
  assert.equal(translateApiMessage('密码错误'), exports.translateMessage('error.invalidCredentials'))
})

test('uses generic or page fallback only when no message is provided', () => {
  for (const message of [undefined, null, '', '  ', {}, 3000]) {
    assert.equal(translateApiMessage(message), 'Request failed')
    assert.equal(translateApiMessage(message, 'auth.loginFailed'), exports.translateMessage('auth.loginFailed'))
  }
})
