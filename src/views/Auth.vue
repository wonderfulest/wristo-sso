<template>
  <div class="auth-page">
    <div class="auth-logo">
      <span class="logo-bold">Wristo<span class="logo-green">Io</span></span>
    </div>

    <h2 class="auth-title">{{ client ? formatClient(client) + ' Continue' : 'Continue' }}</h2>

    <div class="auth-card">
      <button class="google-btn" type="button" :disabled="loading" @click="handleGoogleLogin">
        <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div class="divider">
        <span class="divider-text">or</span>
      </div>

      <!-- Password login (default) -->
      <form v-if="loginMode === 'password'" class="auth-form" @submit.prevent="handlePasswordLogin">
        <label class="auth-label" for="email">Email address</label>
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

        <label class="auth-label" for="password">Password</label>
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
          {{ loading ? 'Logging in...' : 'Continue' }}
        </button>

        <div class="helper-row">
          <a href="javascript:void(0)" @click="switchMode('code')">Login with verification code</a>
        </div>
      </form>

      <!-- Email code login -->
      <form v-else class="auth-form" @submit.prevent="handleVerify">
        <label class="auth-label" for="email2">Email address</label>
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
          {{ sendCooldown > 0 ? `Resend code (${sendCooldown}s)` : (codeState === 'code_sent' ? 'Resend code' : 'Send code') }}
        </button>

        <label class="auth-label" for="code">Verification code</label>
        <div class="code-row">
          <input
            id="code"
            v-model="code"
            inputmode="numeric"
            maxlength="6"
            class="auth-input code-input"
            placeholder="6-digit code"
            required
            :disabled="codeState !== 'code_sent' && !loading"
            @input="onCodeInput"
            @blur="validateField('code')"
          />
          <button class="verify-btn" type="submit" :disabled="!canVerify">
            {{ loading ? 'Verifying...' : 'Verify' }}
          </button>
        </div>
        <div v-if="errors.code" class="input-error">{{ errors.code }}</div>

        <div class="helper-row">
          <a href="javascript:void(0)" @click="switchMode('password')">Login with password</a>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { sendEmailCode, ssoLogin } from '@/api/auth'
import { useUserStore } from '@/store/user'

declare const google: any

type LoginMode = 'password' | 'code'
type CodeState = 'idle' | 'code_sent'

const route = useRoute()
const userStore = useUserStore()

const loginMode = ref<LoginMode>('password')
const email = ref('')
const password = ref('')
const code = ref('')
const loading = ref(false)
const codeState = ref<CodeState>('idle')
const sendCooldown = ref(0)

const client = ref('')
const redirectUri = ref('')

const errors = reactive({ email: '', code: '' })

const formatClient = (c: string) => c.charAt(0).toUpperCase() + c.slice(1)

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

onMounted(() => {
  client.value = (route.query.client as string) || ''
  redirectUri.value = (route.query.redirect_uri as string) || ''
})

function switchMode(mode: LoginMode) {
  loginMode.value = mode
  errors.email = ''
  errors.code = ''
}

function validateField(field: 'email' | 'code') {
  if (field === 'email') {
    if (!email.value.trim()) {
      errors.email = 'Email must not be blank.'
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email.value)) {
      errors.email = 'Invalid email format.'
      return
    }
    errors.email = ''
    return
  }

  if (!code.value.trim()) {
    errors.code = 'Code must not be blank.'
    return
  }
  if (!/^\d{6}$/.test(code.value)) {
    errors.code = 'Invalid code format.'
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

function startCooldown() {
  sendCooldown.value = 60
  const timer = setInterval(() => {
    sendCooldown.value--
    if (sendCooldown.value <= 0) clearInterval(timer)
  }, 1000)
}

async function handleSsoRedirect(token: string) {
  let target = redirectUri.value
  if (!target) {
    target = import.meta.env.VITE_SSO_REDIRECT_URI || ''
  }
  if (!target) {
    ElMessage.success('Authenticated')
    return
  }
  try {
    const ssoRes = await ssoLogin(target, token)
    if (ssoRes.code === 0) {
      window.location.href = target + '?code=' + ssoRes.data
    } else {
      ElMessage.error(ssoRes.msg || 'SSO redirect failed')
    }
  } catch (e: any) {
    console.error('SSO redirect failed:', e.msg)
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
    ElMessage.error('Google login is not configured')
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
      const loginVO = await userStore.loginWithGoogleCode(code, window.location.origin)
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
  height: 100vh;
  overflow: hidden;
}

.auth-page {
  min-height: 0;
  height: 100%;
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 40px;
}

@media (max-width: 600px) {
  .auth-page {
    height: 100%;
    padding-top: 24px;
  }
}

.auth-logo {
  font-size: 2.2rem;
  font-weight: bold;
  margin-bottom: 18px;
  letter-spacing: 1px;
  text-align: center;
}

.logo-bold {
  color: #444;
  font-weight: 700;
}

.logo-green {
  color: #7ca89c;
  font-weight: 700;
  margin-left: 2px;
}

.auth-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 22px;
  text-align: center;
}

.auth-card {
  width: 420px;
  max-width: calc(100vw - 40px);
  background: #fff;
  border: 2px solid #e6e8ea;
  border-radius: 16px;
  padding: 18px;
}

.google-btn {
  width: 100%;
  border-radius: 28px;
  padding: 12px 0;
  border: 2px solid #d1d3d4;
  background: #fff;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s, border-color 0.2s;
}

.google-btn:hover {
  background: #f5f5f5;
  border-color: #bbb;
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
  gap: 10px;
  margin: 16px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e6e8ea;
}

.divider-text {
  font-size: 0.95rem;
  color: #666;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.auth-label {
  font-weight: 800;
  margin-bottom: 4px;
  margin-top: 6px;
  text-align: left;
}

.auth-input {
  padding: 12px 14px;
  border: 3px solid #d1d3d4;
  border-radius: 10px;
  font-size: 1rem;
  margin-bottom: 2px;
  background: #fff;
  outline: none;
  transition: border 0.2s;
}

.auth-input:focus {
  border-color: #7ca89c;
}

.submit-btn,
.send-code-btn {
  margin-top: 6px;
  width: 100%;
  background: #111;
  color: #fff;
  font-size: 1.05rem;
  font-weight: bold;
  border: none;
  border-radius: 28px;
  padding: 12px 0;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover,
.send-code-btn:hover {
  background: #333;
}

.submit-btn:disabled,
.send-code-btn:disabled {
  background: #999;
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
  min-width: 120px;
  background: #111;
  color: #fff;
  font-size: 1.05rem;
  font-weight: bold;
  border: none;
  border-radius: 28px;
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.verify-btn:hover {
  background: #333;
}

.verify-btn:disabled {
  background: #999;
  cursor: not-allowed;
}

.helper-row {
  margin-top: 10px;
  text-align: center;
  font-size: 1rem;
}

.helper-row a {
  color: #7ca89c;
  text-decoration: none;
  font-weight: 600;
}

.helper-row a:hover {
  text-decoration: underline;
}

.input-error {
  color: #e53935;
  font-size: 0.95rem;
  margin-top: -6px;
}
</style>
