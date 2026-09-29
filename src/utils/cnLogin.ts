export interface CnLoginContext {
  clientId?: 'cn' | 'studio'
  redirectUri: string
  state: string
  codeChallenge: string
}
export function parseCnLogin(query: Record<string, unknown>): CnLoginContext {
  const studio = query.client === 'studio'
  const redirectUri = String(query.redirect_uri || '')
  const url = new URL(redirectUri)
  const local =
    ['localhost', '127.0.0.1'].includes(url.hostname) &&
    url.protocol === 'http:' &&
    url.port === (studio ? '3004' : '3008')
  const production =
    (studio ? ['studio.wristo.io'] : ['wristo.cn', 'www.wristo.cn']).includes(url.hostname) &&
    url.protocol === 'https:' &&
    !url.port
  if (
    (!local && !production) ||
    url.pathname !== '/auth/callback' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password ||
    !['cn', 'studio'].includes(String(query.client)) ||
    !/^[a-f0-9]{64}$/.test(String(query.state)) ||
    !/^[A-Za-z0-9_-]{43}$/.test(String(query.code_challenge)) ||
    query.code_challenge_method !== 'S256'
  ) {
    throw new Error('登录链接已失效，请返回中国站重新登录。')
  }
  return {
    clientId: studio ? 'studio' : 'cn',
    redirectUri,
    state: String(query.state),
    codeChallenge: String(query.code_challenge),
  }
}
export function randomVerifier() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')
}
export async function challenge(verifier: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  )
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
export function finishCnLogin(context: CnLoginContext, code: string) {
  const target = new URL(context.redirectUri)
  target.searchParams.set('code', code)
  target.searchParams.set('state', context.state)
  window.location.replace(target.toString())
}
