import { defineStore } from 'pinia'

export const SUPPORTED_LOCALES = ['en', 'zh', 'de', 'es', 'fr', 'it'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en'
const SHARED_LOCALE_KEY = 'wristo-locale'
const LEGACY_LOCALE_KEYS: string[] = []

export function normalizeLocale(value: unknown): SupportedLocale {
  const locale = String(value || '').toLowerCase()
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale)
    ? (locale as SupportedLocale)
    : DEFAULT_LOCALE
}

export function getRouteLocaleParam(value: unknown): SupportedLocale | null {
  const locale = String(value || '').toLowerCase()
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : null
}

function readLocaleValue(value: string | null): SupportedLocale | null {
  const direct = getRouteLocaleParam(value)
  if (direct) return direct
  try {
    const parsed = JSON.parse(value || '{}') as { currentLocale?: string }
    return getRouteLocaleParam(parsed.currentLocale)
  } catch {
    return null
  }
}

export function stripLocaleFromPath(path: string): string {
  const pattern = `^/(${SUPPORTED_LOCALES.join('|')})(?=/|$)`
  const stripped = path.replace(new RegExp(pattern), '')
  return stripped || '/'
}

export function addLocaleToPath(path: string, locale: SupportedLocale): string {
  const normalizedPath = stripLocaleFromPath(path)
  return normalizedPath === '/'
    ? `/${locale}`
    : `/${locale}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`
}

function getCookieLocale(): SupportedLocale | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${SHARED_LOCALE_KEY}=`))
  if (!match) return null
  return getRouteLocaleParam(decodeURIComponent(match.split('=').slice(1).join('=')))
}

function setCookieLocale(locale: SupportedLocale) {
  if (typeof document === 'undefined') return
  const maxAge = 60 * 60 * 24 * 365
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${SHARED_LOCALE_KEY}=${encodeURIComponent(locale)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

function getStoredLocale(): SupportedLocale {
  if (typeof localStorage === 'undefined') return DEFAULT_LOCALE
  const local = readLocaleValue(localStorage.getItem(SHARED_LOCALE_KEY))
  if (local) return local

  const cookie = getCookieLocale()
  if (cookie) {
    localStorage.setItem(SHARED_LOCALE_KEY, cookie)
    return cookie
  }

  for (const key of LEGACY_LOCALE_KEYS) {
    const legacy = readLocaleValue(localStorage.getItem(key))
    if (legacy) {
      localStorage.setItem(SHARED_LOCALE_KEY, legacy)
      setCookieLocale(legacy)
      return legacy
    }
  }

  return DEFAULT_LOCALE
}

const localeStorage = {
  getItem: () => {
    const locale = getStoredLocale()
    return JSON.stringify({ currentLocale: locale })
  },
  setItem: (_key: string, value: string) => {
    const locale = readLocaleValue(value) || DEFAULT_LOCALE
    localStorage.setItem(SHARED_LOCALE_KEY, locale)
    setCookieLocale(locale)
  },
}

export const useLocaleStore = defineStore('locale', {
  state: () => ({
    currentLocale: getStoredLocale(),
  }),
  actions: {
    setLocale(locale: string) {
      this.currentLocale = normalizeLocale(locale)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SHARED_LOCALE_KEY, this.currentLocale)
      }
      setCookieLocale(this.currentLocale)
      if (typeof document !== 'undefined') {
        document.documentElement.lang = this.currentLocale
      }
    },
    syncSharedLocale() {
      const locale = getStoredLocale()
      if (locale !== this.currentLocale) {
        this.currentLocale = locale
      }
      this.syncDocumentLang()
    },
    syncDocumentLang() {
      if (typeof document !== 'undefined') {
        document.documentElement.lang = this.currentLocale
      }
    },
  },
  persist: {
    key: SHARED_LOCALE_KEY,
    storage: localeStorage,
  },
})
