<template>
  <div class="auth-page">
    <BrandLogo class="auth-logo" />
    <div class="auth-context">{{ clientLabel }}</div>
    <h1 class="auth-heading">{{ t('auth.title') }}</h1>
    <p class="auth-subtitle">{{ t('auth.subtitle') }}</p>

    <div class="auth-card">
      <button class="google-btn" type="button" :disabled="loading" @click="handleGoogleLogin">
        <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {{ t('auth.google') }}
      </button>

      <div class="divider">
        <span class="divider-text">{{ t('auth.or') }}</span>
      </div>

      <!-- Password login (default) -->
      <form v-if="loginMode === 'password'" class="auth-form" @submit.prevent="handlePasswordLogin">
        <label class="auth-label" for="email">{{ t('auth.email') }}</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="auth-input"
          autocomplete="username"
          required
          :disabled="loading"
          @blur="validateField('email')"
        />
        <div v-if="errors.email" class="input-error">{{ errors.email }}</div>

        <label class="auth-label" for="password">{{ t('auth.password') }}</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="auth-input"
          autocomplete="current-password"
          required
          :disabled="loading"
        />

        <button class="submit-btn" type="submit" :disabled="!canPasswordLogin">
          {{ loading ? t('auth.loggingIn') : t('auth.continue') }}
        </button>

        <div class="helper-row">
          <a href="javascript:void(0)" @click="switchMode('code')">{{ t('auth.loginWithCode') }}</a>
        </div>
      </form>

      <!-- Email code login -->
      <form v-else class="auth-form" @submit.prevent="handleVerify">
        <label class="auth-label" for="email2">{{ t('auth.email') }}</label>
        <input
          id="email2"
          v-model="email"
          type="email"
          class="auth-input"
          autocomplete="username"
          required
          :disabled="loading"
          @blur="validateField('email')"
        />
        <div v-if="errors.email" class="input-error">{{ errors.email }}</div>

        <button class="send-code-btn" type="button" :disabled="!canSendCode" @click="handleSendCode">
          {{ sendCodeLabel }}
        </button>

        <label class="auth-label" for="code">{{ t('auth.verificationCode') }}</label>
        <div class="code-row">
          <input
            id="code"
            v-model="code"
            inputmode="numeric"
            maxlength="6"
            class="auth-input code-input"
            :placeholder="t('auth.codePlaceholder')"
            required
            :disabled="codeState !== 'code_sent' && !loading"
            @input="onCodeInput"
            @blur="validateField('code')"
          />
          <button class="verify-btn" type="submit" :disabled="!canVerify">
            {{ loading ? t('auth.verifying') : t('auth.verify') }}
          </button>
        </div>
        <div v-if="errors.code" class="input-error">{{ errors.code }}</div>

        <div class="helper-row">
          <a href="javascript:void(0)" @click="switchMode('password')">{{ t('auth.loginWithPassword') }}</a>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { getSsoSession, sendEmailCode, ssoLogin } from '@/api/auth'
import { useUserStore } from '@/store/user'
import BrandLogo from '@/components/BrandLogo.vue'
import { translateApiMessage, useI18n } from '@/i18n'
import { resolveSsoClientId } from '@/utils/ssoClient'

declare const google: any

type LoginMode = 'password' | 'code'
type CodeState = 'idle' | 'code_sent'

const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()

const loginMode = ref<LoginMode>('password')
const email = ref('')
const password = ref('')
const code = ref('')
const loading = ref(false)
const codeState = ref<CodeState>('idle')
const sendCooldown = ref(0)

const redirectUri = ref('')
const clientId = computed(() => resolveSsoClientId(route.query.client, redirectUri.value))

const errors = reactive({ email: '', code: '' })

const googleClientId = import.meta.env.VITE_WRISTO_GOOGLE_CLIENT_ID || ''
const googleOAuthRedirectUri = import.meta.env.VITE_WRISTO_GOOGLE_OAUTH_REDIRECT_URI || window.location.origin

const clientLabel = computed(() => {
  const client = clientId.value
  if (client === 'studio') return 'Wristo Studio'
  if (client === 'store') return 'Wristo Store'
  if (client === 'merchant') return 'Wristo Merchant'
  if (client === 'growth') return 'Wristo Growth'
  return 'Wristo SSO'
})

onMounted(async () => {
  redirectUri.value = (route.query.redirect_uri as string) || ''
  if (!redirectUri.value) {
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
  loginMode.value = mode
  errors.email = ''
  errors.code = ''
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
  return codeState.value === 'code_sent' && !loading.value && !errors.email && !errors.code && /^\d{6}$/.test(code.value)
})

const sendCodeLabel = computed(() => {
  if (sendCooldown.value > 0) {
    return t('auth.resendCodeSeconds', { seconds: sendCooldown.value })
  }
  return codeState.value === 'code_sent' ? t('auth.resendCode') : t('auth.sendCode')
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
    const ssoRes = await ssoLogin(clientId.value, target, token || undefined)
    if (ssoRes.code === 0) {
      window.location.href = target + '?code=' + ssoRes.data
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
html, body {
  min-height: 100%;
}

.auth-page {
  min-height: 100%;
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 12px 20px 28px;
  box-sizing: border-box;
}

@media (max-width: 600px) {
  .auth-page {
    padding: 18px 16px 26px;
  }
}

.auth-logo {
  margin-bottom: 12px;
}

.auth-context {
  color: #0f6b68;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.2;
  margin-bottom: 8px;
  text-align: center;
  text-transform: uppercase;
}

.auth-heading {
  color: #111817;
  font-size: clamp(2rem, 6vw, 2.35rem);
  font-weight: 800;
  line-height: 1.06;
  margin: 0;
  text-align: center;
}

.auth-subtitle {
  color: #596460;
  font-size: 1rem;
  line-height: 1.55;
  margin: 10px auto 16px;
  max-width: 360px;
  text-align: center;
}

.auth-card {
  width: 420px;
  max-width: calc(100vw - 40px);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #dfe7e4;
  border-radius: 8px;
  box-shadow: 0 24px 70px rgba(24, 38, 34, 0.12);
  box-sizing: border-box;
  padding: 20px;
}

.google-btn {
  width: 100%;
  min-height: 48px;
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid #cfd9d5;
  background: #fff;
  font-size: 1rem;
  font-weight: 750;
  cursor: pointer;
  color: #1c2623;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.google-btn:hover {
  background: #f7faf9;
  border-color: #9db2aa;
  box-shadow: 0 8px 20px rgba(24, 38, 34, 0.08);
}

.google-btn:active {
  transform: translateY(1px);
}

.google-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.google-icon {
  flex-shrink: 0;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e6e8ea;
}

.divider-text {
  font-size: 0.82rem;
  color: #74817c;
  font-weight: 700;
  text-transform: uppercase;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.auth-label {
  color: #24312d;
  font-size: 0.9rem;
  font-weight: 750;
  margin-top: 8px;
  text-align: left;
}

.auth-input {
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  border: 1px solid #cdd9d5;
  border-radius: 8px;
  font-size: 1rem;
  color: #17201d;
  background: #fbfdfc;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  box-sizing: border-box;
}

.auth-input:focus {
  border-color: #0f6b68;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(15, 107, 104, 0.13);
}

.submit-btn,
.send-code-btn {
  min-height: 48px;
  margin-top: 10px;
  width: 100%;
  background: #0f6b68;
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.submit-btn:hover,
.send-code-btn:hover {
  background: #0b5553;
  box-shadow: 0 10px 22px rgba(15, 107, 104, 0.22);
}

.submit-btn:active,
.send-code-btn:active,
.verify-btn:active {
  transform: translateY(1px);
}

.submit-btn:disabled,
.send-code-btn:disabled {
  background: #9aa6a2;
  box-shadow: none;
  cursor: not-allowed;
}

.code-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.code-input {
  flex: 1;
}

.verify-btn {
  min-width: 112px;
  min-height: 48px;
  background: #0f6b68;
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  border: none;
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.verify-btn:hover {
  background: #0b5553;
  box-shadow: 0 10px 22px rgba(15, 107, 104, 0.22);
}

.verify-btn:disabled {
  background: #9aa6a2;
  box-shadow: none;
  cursor: not-allowed;
}

.helper-row {
  margin-top: 10px;
  text-align: center;
  font-size: 1rem;
}

.helper-row a {
  color: #0f6b68;
  text-decoration: none;
  font-weight: 750;
}

.helper-row a:hover {
  text-decoration: underline;
}

.input-error {
  color: #b42318;
  font-size: 0.9rem;
  font-weight: 650;
  line-height: 1.4;
  margin-top: -2px;
  text-align: left;
}

button:focus-visible,
.auth-input:focus-visible {
  outline: 3px solid rgba(15, 107, 104, 0.28);
  outline-offset: 2px;
}

@media (max-width: 600px) {
  .auth-card {
    max-width: 100%;
    padding: 18px;
  }

  .auth-heading {
    font-size: 2rem;
  }

  .code-row {
    flex-direction: column;
    align-items: stretch;
  }

  .verify-btn {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
  }
}
</style>
