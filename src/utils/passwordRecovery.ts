import type { LocationQuery, RouteLocationNormalizedLoaded } from 'vue-router'

const STORAGE_KEY = 'wristo:password-recovery'
const LOGIN_KEYS = ['client', 'redirect_uri', 'state', 'code_challenge', 'code_challenge_method', 'next', 'force_login']

export function recoveryRoute(route: RouteLocationNormalizedLoaded, path: string, query: LocationQuery) {
  const locale = route.params.lang
  return { path: typeof locale === 'string' ? `/${locale}${path}` : path, query }
}

export function recoveryLoginQuery(query: LocationQuery): LocationQuery {
  return Object.fromEntries(LOGIN_KEYS.flatMap(key =>
    typeof query[key] === 'string' ? [[key, query[key]]] : [],
  ))
}

export function forgotPasswordRoute(route: RouteLocationNormalizedLoaded) {
  return recoveryRoute(route, '/forgot-password', recoveryLoginQuery(route.query))
}

export function saveRecoveryContext(flowId: string, route: RouteLocationNormalizedLoaded) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      flowId,
      locale: route.params.lang,
      query: recoveryLoginQuery(route.query),
      expiresAt: Date.now() + 30 * 60_000,
    }))
  } catch {
    // Storage can be unavailable in private browsers.
  }
}

export function recoveryContext(flowId: unknown): { locale?: string; query: LocationQuery } {
  if (typeof flowId === 'string' && /^[a-f0-9]{64}$/.test(flowId)) {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (saved?.flowId === flowId && saved.expiresAt > Date.now()) {
        return { locale: saved.locale, query: recoveryLoginQuery(saved.query) }
      }
    } catch {
      // Fall back to the site's normal login entry.
    }
  }
  return { query: {} }
}
