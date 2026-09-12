export interface AppleAuthorization {
  authorization?: { state?: string; id_token?: string }
}

export interface AppleSdk {
  auth: {
    init(config: { clientId: string; redirectURI: string; scope: string; state: string; nonce: string; usePopup: boolean }): void
    signIn(): Promise<AppleAuthorization>
  }
}

declare global {
  interface Window { AppleID?: AppleSdk }
}

const hex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')

// Prepare before the click so signIn can open its popup during user activation.
export async function prepareAppleAttempt() {
  const state = hex(crypto.getRandomValues(new Uint8Array(32)))
  const nonce = hex(crypto.getRandomValues(new Uint8Array(32)))
  const hashedNonce = hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce))))
  return { state, nonce, hashedNonce }
}

export function appleCredential(result: AppleAuthorization, attempt: Awaited<ReturnType<typeof prepareAppleAttempt>>) {
  if (result.authorization?.state !== attempt.state || !result.authorization.id_token) {
    throw new Error('Invalid Apple authorization response')
  }
  return { identityToken: result.authorization.id_token, nonce: attempt.nonce }
}
