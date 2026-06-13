const KNOWN_CLIENTS = ['store', 'dashboard', 'merchant', 'studio', 'growth'] as const

export type SsoClientId = typeof KNOWN_CLIENTS[number]

const LOCAL_PORT_CLIENTS: Record<string, SsoClientId> = {
  '3000': 'store',
  '3002': 'dashboard',
  '3003': 'merchant',
  '3004': 'studio',
  '3006': 'growth'
}

const HOST_CLIENTS: Array<[RegExp, SsoClientId]> = [
  [/(^|\.)dashboard\.wristo\.io$/i, 'dashboard'],
  [/(^|\.)merchant\.wristo\.io$/i, 'merchant'],
  [/(^|\.)studio\.wristo\.io$/i, 'studio'],
  [/(^|\.)growth\.wristo\.io$/i, 'growth'],
  [/(^|\.)wristo\.io$/i, 'store']
]

export function normalizeSsoClientId(clientId: unknown): SsoClientId | null {
  if (typeof clientId !== 'string') return null
  return KNOWN_CLIENTS.includes(clientId as SsoClientId) ? clientId as SsoClientId : null
}

export function inferSsoClientIdFromRedirectUri(redirectUri: string): SsoClientId | null {
  if (!redirectUri) return null

  try {
    const url = new URL(redirectUri)
    if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') && LOCAL_PORT_CLIENTS[url.port]) {
      return LOCAL_PORT_CLIENTS[url.port]
    }

    return HOST_CLIENTS.find(([pattern]) => pattern.test(url.hostname))?.[1] || null
  } catch {
    return null
  }
}

export function resolveSsoClientId(clientId: unknown, redirectUri: string, fallback: SsoClientId = 'store'): SsoClientId {
  return inferSsoClientIdFromRedirectUri(redirectUri) || normalizeSsoClientId(clientId) || fallback
}
