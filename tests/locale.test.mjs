import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('../src/store/locale.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
})

test('matches browser preferences in order and remembers a manual selection', () => {
  const values = new Map()
  const context = {
    exports: {},
    require: () => ({ defineStore: (_, options) => options }),
    navigator: { languages: ['ja-JP', 'fr-CA', 'de-DE'], language: 'ja-JP' },
    localStorage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) },
    document: { cookie: '', documentElement: {} },
    window: { location: { protocol: 'https:' } },
  }
  vm.runInNewContext(outputText, context)
  const { getStoredLocale, useLocaleStore } = context.exports
  assert.equal(getStoredLocale(), 'fr')
  context.navigator.languages = ['ja-JP']
  assert.equal(getStoredLocale(), 'en')
  context.navigator.language = 'zh-TW'
  assert.equal(getStoredLocale(), 'zh')
  assert.equal(values.size, 0)
  useLocaleStore.actions.setLocale.call({}, 'it')
  assert.equal(getStoredLocale(), 'it')
  values.clear()
  assert.equal(getStoredLocale(), 'it')
})
