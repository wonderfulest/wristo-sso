<template>
  <div class="auth-page">
    <header class="brand">
      <img src="/brand/wristo-logo-horizontal.svg" alt="Wristo" />
      <span>{{ clientLabel }}</span>
    </header>
    <section class="auth-card" aria-labelledby="auth-title">
      <h1 id="auth-title">{{ t('auth.title') }}</h1>
      <p>{{ t(clientLabel === 'Wristo Store' ? 'auth.storeSubtitle' : 'auth.subtitle') }}</p>
      <div class="tabs">
        <button type="button" :aria-pressed="loginMode === 'password'" :disabled="loading" @click="switchMode('password')">{{ t('auth.passwordTab') }}</button>
        <button type="button" :aria-pressed="loginMode === 'code'" :disabled="loading" @click="switchMode('code')">{{ t('auth.codeTab') }}</button>
      </div>
      <form @submit.prevent="loginMode === 'password' ? handlePasswordLogin() : handleVerify()">
        <div class="field">
          <label for="email">{{ t('auth.email') }}</label>
          <input id="email" v-model="email" type="email" placeholder="name@example.com" autocomplete="username" required :disabled="loading" @blur="validateField('email')" />
          <div v-if="errors.email" class="input-error" role="alert">{{ errors.email }}</div>
        </div>
        <div v-if="loginMode === 'password'" class="field">
          <div class="row">
            <label for="password">{{ t('auth.password') }}</label>
            <router-link :to="forgotPasswordRoute(route)">{{ t('auth.forgotPassword') }}</router-link>
          </div>
          <div class="inside">
            <input id="password" v-model="password" :type="passwordVisible ? 'text' : 'password'" :placeholder="t('auth.passwordPrompt')" autocomplete="current-password" required :disabled="loading" />
          <button
            class="password-toggle"
            type="button"
            :aria-label="t('auth.showPassword')"
            :aria-pressed="passwordVisible"
            aria-controls="password"
            @click="passwordVisible = !passwordVisible"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              <path v-if="passwordVisible" d="m3 3 18 18" />
            </svg>
          </button>
          </div>
        </div>
        <div v-else class="field">
          <label for="code">{{ t('auth.verificationCode') }}</label>
          <div class="inside">
            <input id="code" v-model="code" autocomplete="one-time-code" inputmode="numeric" maxlength="6" :placeholder="t('auth.codePlaceholder')" required :disabled="loading" @input="onCodeInput" @blur="validateField('code')" />
            <button type="button" :disabled="!canSendCode" @click="handleSendCode">{{ sendCodeLabel }}</button>
          </div>
          <div v-if="errors.code" class="input-error" role="alert">{{ errors.code }}</div>
        </div>
        <button class="submit" type="submit" :disabled="loginMode === 'password' ? !canPasswordLogin : !canVerify">
          {{ t(loading ? 'auth.loggingIn' : 'auth.signInAction') }}
        </button>
      </form>
      <div class="divider">{{ t('auth.otherMethods') }}</div>
      <div class="social">
      <button class="google-btn" type="button" :disabled="loading" @click="handleGoogleLogin">
        <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google
      </button>

      <button v-if="appleConfigured" class="google-btn apple-btn" type="button"
        :disabled="loading || !appleAttempt" @click="handleAppleLogin">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
          <path d="M17.05 12.54c.03 3.23 2.83 4.3 2.86 4.31-.02.08-.45 1.54-1.48 3.05-.9 1.3-1.83 2.6-3.3 2.63-1.45.03-1.92-.85-3.58-.85-1.65 0-2.17.82-3.55.88-1.42.05-2.51-1.41-3.41-2.71-1.85-2.67-3.27-7.54-1.37-10.84.94-1.64 2.62-2.68 4.44-2.71 1.39-.03 2.7.94 3.55.94.85 0 2.45-1.16 4.13-.99.7.03 2.67.28 3.93 2.13-.1.06-2.35 1.37-2.32 4.16zM14.33 4.5c.75-.91 1.26-2.17 1.12-3.43-1.08.04-2.39.72-3.17 1.63-.69.79-1.29 2.05-1.13 3.26 1.2.09 2.43-.61 3.18-1.46z" />
        </svg>
        Apple
      </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { forgotPasswordRoute } from '@/utils/passwordRecovery'
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { getSsoSession, sendEmailCode, ssoLogin } from '@/api/auth'
import { useUserStore } from '@/store/user'
import { translateApiMessage, useI18n } from '@/i18n'
import { prepareAppleAttempt, appleCredential } from '@/utils/appleSignIn'
import { resolveSsoClientId } from '@/utils/ssoClient'

declare const google: any

type LoginMode = 'password' | 'code'
type CodeState = 'idle' | 'code_sent'
const LOGIN_MODE_STORAGE_KEY = 'wristo:sso-login-mode'

const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()

const loginMode = ref<LoginMode>(readStoredLoginMode())
const email = ref('')
const password = ref('')
const passwordVisible = ref(false)
const code = ref('')
const loading = ref(false)
const codeState = ref<CodeState>('idle')
const sendCooldown = ref(0)

const redirectUri = ref('')
const clientId = computed(() => resolveSsoClientId(route.query.client, redirectUri.value))
const nextPath = computed(() => {
  const raw = route.query.next
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' && value.startsWith('/') ? value : ''
})

const errors = reactive({ email: '', code: '' })

const appleClientId = (import.meta.env.VITE_WRISTO_APPLE_CLIENT_ID || '').trim()
const appleRedirectUri = (import.meta.env.VITE_WRISTO_APPLE_REDIRECT_URI || '').trim()
const appleConfigured = Boolean(appleClientId && appleRedirectUri)
const appleAttempt = ref<Awaited<ReturnType<typeof prepareAppleAttempt>> | null>(null)

async function refreshAppleAttempt() {
  appleAttempt.value = null
  if (appleConfigured) {
    try { appleAttempt.value = await prepareAppleAttempt() }
    catch { ElMessage.error(t('auth.appleFailed')) }
  }
}

async function handleAppleLogin() {
  const attempt = appleAttempt.value
  if (loading.value || !attempt) return
  const sdk = window.AppleID
  if (!sdk) {
    ElMessage.error(t('auth.appleUnavailable'))
    return
  }
  loading.value = true
  appleAttempt.value = null
  try {
    sdk.auth.init({ clientId: appleClientId, redirectURI: appleRedirectUri,
      scope: 'name email', state: attempt.state, nonce: attempt.hashedNonce, usePopup: true })
    const result = await sdk.auth.signIn()
    const login = await userStore.loginWithApple(appleCredential(result, attempt))
    await handleSsoRedirect(login?.token || '')
  } catch (error: unknown) {
    const reason = (error as { error?: string } | null)?.error
    if (reason !== 'popup_closed_by_user' && reason !== 'user_cancelled_authorize' && reason !== 'access_denied') {
      ElMessage.error(t('auth.appleFailed'))
    }
  } finally {
    await refreshAppleAttempt()
    loading.value = false
  }
}

const googleClientId = import.meta.env.VITE_WRISTO_GOOGLE_CLIENT_ID || ''
const googleOAuthRedirectUri = resolveGoogleOAuthRedirectUri(import.meta.env.VITE_WRISTO_GOOGLE_OAUTH_REDIRECT_URI)

function resolveGoogleOAuthRedirectUri(configuredRedirectUri?: string) {
  const fallback = window.location.origin
  const configured = configuredRedirectUri?.trim()
  if (!configured) return fallback

  try {
    const url = new URL(configured, fallback)
    if (url.pathname.replace(/\/$/, '') === '/api/auth/google/callback') {
      return fallback
    }
    return url.toString().replace(/\/$/, '')
  } catch {
    return fallback
  }
}

const clientLabel = computed(() => {
  const client = clientId.value
  if (client === 'image') return 'Wristo Image'
  if (client === 'studio') return 'Wristo Studio'
  if (client === 'store') return 'Wristo Store'
  if (client === 'merchant') return 'Wristo Merchant'
  if (client === 'growth') return 'Wristo Growth'
  return 'Wristo SSO'
})

onMounted(async () => {
  void refreshAppleAttempt()
  redirectUri.value = (route.query.redirect_uri as string) || ''
  if (!redirectUri.value) {
    return
  }

  if (route.query.force_login === '1') {
    await userStore.logout()
    return
  }

  try {
    const session = await getSsoSession()
    if (session.code === 0 && session.data?.authenticated) {
      await handleSsoRedirect('')
    }
  } catch (e) {
    console.info('No active SSO session', e)
  }
})

function switchMode(mode: LoginMode) {
  passwordVisible.value = false
  loginMode.value = mode
  saveLoginMode(mode)
  errors.email = ''
  errors.code = ''
}

function readStoredLoginMode(): LoginMode {
  try {
    const storedMode = localStorage.getItem(LOGIN_MODE_STORAGE_KEY)
    return storedMode === 'code' ? 'code' : 'password'
  } catch {
    return 'password'
  }
}

function saveLoginMode(mode: LoginMode) {
  try {
    localStorage.setItem(LOGIN_MODE_STORAGE_KEY, mode)
  } catch {
    // Ignore storage failures and keep the selected mode for the current session.
  }
}

function validateField(field: 'email' | 'code') {
  if (field === 'email') {
    if (!email.value.trim()) {
      errors.email = t('validation.emailRequired')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email.value)) {
      errors.email = t('validation.emailInvalid')
      return
    }
    errors.email = ''
    return
  }

  if (!code.value.trim()) {
    errors.code = t('validation.codeRequired')
    return
  }
  if (!/^\d{6}$/.test(code.value)) {
    errors.code = t('validation.codeInvalid')
    return
  }
  errors.code = ''
}

const canPasswordLogin = computed(() => {
  return !loading.value && !!email.value.trim() && /^\S+@\S+\.\S+$/.test(email.value) && !!password.value
})

const canSendCode = computed(() => {
  return !loading.value && sendCooldown.value === 0 && !errors.email && !!email.value.trim() && /^\S+@\S+\.\S+$/.test(email.value)
})

const canVerify = computed(() => {
  return !loading.value && !errors.email && !errors.code && /^\S+@\S+\.\S+$/.test(email.value) && /^\d{6}$/.test(code.value)
})

const sendCodeLabel = computed(() => {
  if (sendCooldown.value > 0) {
    return t('auth.resendCodeSeconds', { seconds: sendCooldown.value })
  }
  return codeState.value === 'code_sent' ? t('auth.resendEmailCode') : t('auth.sendCode')
})

function startCooldown() {
  sendCooldown.value = 60
  const timer = setInterval(() => {
    sendCooldown.value--
    if (sendCooldown.value <= 0) clearInterval(timer)
  }, 1000)
}

async function handleSendCode() {
  validateField('email')
  if (errors.email) return

  loading.value = true
  try {
    await sendEmailCode({ email: email.value.trim() })
    codeState.value = 'code_sent'
    startCooldown()
    ElMessage.success(t('auth.codeSent'))
  } catch (e: any) {
    console.error('send code error', e)
  } finally {
    loading.value = false
  }
}

async function handleVerify() {
  validateField('email')
  validateField('code')
  if (errors.email || errors.code) return

  loading.value = true
  try {
    const loginVO = await userStore.loginWithEmailCode({ email: email.value.trim(), code: code.value.trim() })
    const token = loginVO?.token || localStorage.getItem('token') || ''
    await handleSsoRedirect(token)
  } catch (e: any) {
    console.error('verify code error', e)
  } finally {
    loading.value = false
  }
}

async function handleSsoRedirect(token: string) {
  let target = redirectUri.value
  if (!target) {
    target = import.meta.env.VITE_WRISTO_DEFAULT_SSO_REDIRECT_URI || ''
  }
  if (!target) {
    ElMessage.success(t('auth.authenticated'))
    return
  }
  try {
    const ssoRes = await ssoLogin(clientId.value, target, token || undefined, typeof route.query.code_challenge === 'string' ? route.query.code_challenge : undefined)
    if (ssoRes.code === 0 && ssoRes.data) {
      const callbackUrl = new URL(target, window.location.origin)
      callbackUrl.searchParams.set('code', ssoRes.data)
      if (typeof route.query.state === 'string') {
        callbackUrl.searchParams.set('state', route.query.state)
      }
      if (nextPath.value) {
        callbackUrl.searchParams.set('next', nextPath.value)
      }
      window.location.href = callbackUrl.toString()
    } else {
      ElMessage.error(translateApiMessage(ssoRes.msg, 'auth.ssoRedirectFailed'))
    }
  } catch (e: any) {
    console.error('SSO redirect failed:', e.msg)
    ElMessage.error(translateApiMessage(e?.msg, 'auth.ssoRedirectFailed'))
  }
}

const handlePasswordLogin = async () => {
  validateField('email')
  if (errors.email || !password.value) return

  loading.value = true
  try {
    const loginVO = await userStore.loginWithPassword({ email: email.value, password: password.value })
    const token = loginVO?.token || localStorage.getItem('token') || ''
    await handleSsoRedirect(token)
  } catch (error: any) {
    console.error('password login error:', error)
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = () => {
  if (!googleClientId) {
    ElMessage.error(t('auth.googleNotConfigured'))
    return
  }
  const onGoogleSuccess = async (credential: string) => {
    try {
      const loginVO = await userStore.loginWithGoogle({ credential })
      const token = loginVO?.token || localStorage.getItem('token') || ''
      await handleSsoRedirect(token)
    } catch (e: any) {
      console.error('google login error', e)
    }
  }

  const onGoogleCodeSuccess = async (code: string) => {
    try {
      const loginVO = await userStore.loginWithGoogleCode(code, googleOAuthRedirectUri)
      const token = loginVO?.token || localStorage.getItem('token') || ''
      await handleSsoRedirect(token)
    } catch (e: any) {
      console.error('google code login error', e)
    }
  }

  try {
    google.accounts.oauth2.initCodeClient({
      client_id: googleClientId,
      scope: 'openid email profile',
      ux_mode: 'popup',
      callback: (response: any) => {
        if (response.code) onGoogleCodeSuccess(response.code)
      }
    }).requestCode()
  } catch {
    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response: any) => {
        if (response.credential) onGoogleSuccess(response.credential)
      }
    })
    google.accounts.id.prompt()
  }
}

function onCodeInput() {
  code.value = code.value.replace(/\D/g, '').slice(0, 6)
}
</script>

<style scoped>
*{box-sizing:border-box}
.auth-page{margin:0; background:#f5f7f5; color:#18241e; font:15px/1.5 system-ui,sans-serif}
.brand{height:76px; display:flex; align-items:center; gap:18px; padding:0 6vw; border-bottom:1px solid #dce4de; background:white}
.brand img{width:106px}
.brand span{border-left:1px solid #cdd8d0; padding-left:18px; color:#4d6055; font-weight:600}
.auth-card{margin:clamp(24px,7vh,72px) auto; width:min(448px,100%); background:white; padding:36px 38px; border:1px solid #dce4de; border-radius:18px}
h1{font-size:32px; letter-spacing:-1px; margin:0}
p{color:#59675e; margin:5px 0 24px}
.tabs,.social{display:flex; gap:6px}
.tabs{background:#eff3f0; padding:4px; border-radius:10px; margin-bottom:22px}
button,input{font:inherit}
button{cursor:pointer}
.tabs button,.social button{flex:1}
.tabs button{border:0; background:transparent; border-radius:7px; height:39px; color:#53655b}
.tabs [aria-pressed="true"]{background:white; color:#085944; font-weight:650; box-shadow:0 1px 4px #14352921}
label,.row{display:flex; align-items:center; justify-content:space-between; font-size:14px; font-weight:600; margin-bottom:7px}
.row label{margin:0}
input{width:100%; border:1px solid #becbc2; border-radius:8px; height:47px; padding:0 12px; background:white}
input::placeholder{color:#778179}
.field{margin-bottom:17px}
.row a{background:none; border:0; color:#11674e; font-size:13px}
.inside svg{width:19px}
.submit{width:100%; border:0; border-radius:8px; height:47px; background:#09664e; color:white; font-weight:650; margin-top:4px}
.divider{display:flex; align-items:center; gap:12px; color:#69766d; font-size:12px; margin:24px 0 16px}
.divider:after,.divider:before{content:""; height:1px; background:#dde5df; flex:1}
.social{gap:10px}
.social button{display:flex; align-items:center; justify-content:center; gap:9px; height:44px; border-radius:8px; border:1px solid #ccd5ce; background:white; font-weight:600}
.social .apple-btn{background:#171918; color:white; border-color:#171918}
.social svg{width:18px}
@media(max-width:540px){.auth-page{background:white}
.brand{height:66px; padding:0 24px}
.auth-card{padding:0 24px; border:0; margin:36px auto}
h1{font-size:29px}
}

.auth-page { flex: 1;  color-scheme: light;  text-align: left;  }

.inside { display: flex;  align-items: center;  border: 1px solid #becbc2;  border-radius: 8px;  }

.inside:focus-within { outline: 2px solid #09664e;  outline-offset: 1px;  }

.inside input { flex: 1;  min-width: 0;  border: 0;  outline: none;  height: 45px;  }

.inside button { display: grid;  place-items: center;  color: #11674e;  background: transparent;  border: 0;  padding: 0 12px;  min-height: 44px;  font-size: 13px;  }

input { color: #18241e;  font-size: 16px;  }

button:disabled { cursor: default;  opacity: .72;  }

button:focus-visible, a:focus-visible { outline: 2px solid #09664e;  outline-offset: 2px;  }

.input-error { color: #a42621;  font-size: 13px;  margin-top: 4px;  }

:global(.main-content:has(> .auth-page)) { max-width: none;  padding: 0;  }
</style>
