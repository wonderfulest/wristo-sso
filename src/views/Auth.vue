<template>
  <div class="auth-page">
    <div class="auth-logo">
      <span class="logo-bold">Wristo<span class="logo-green">Io</span></span>
    </div>

    <h2 class="auth-title">{{ client ? formatClient(client) + ' Continue' : 'Continue' }}</h2>

    <div class="auth-card">
      <button class="google-btn" type="button" disabled>Continue with Google</button>

      <div class="divider">
        <span class="divider-text">or</span>
      </div>

      <form class="auth-form" @submit.prevent="handleVerify">
        <label class="auth-label" for="email">Email address</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="auth-input"
          autocomplete="username"
          required
          :disabled="state === 'verifying'"
          @blur="validateField('email')"
        />
        <div v-if="errors.email" class="input-error">{{ errors.email }}</div>

        <button class="send-code-btn" type="button" :disabled="!canSendCode" @click="handleSendCode">
          {{ state === 'code_sent' ? 'Resend code' : 'Send code' }}
        </button>

        <label class="auth-label" for="code">Code</label>
        <div class="code-row">
          <input
            id="code"
            v-model="code"
            inputmode="numeric"
            maxlength="6"
            class="auth-input code-input"
            required
            :disabled="state !== 'code_sent' && state !== 'verifying'"
            @input="onCodeInput"
            @blur="validateField('code')"
          />
          <button class="verify-btn" type="submit" :disabled="!canVerify">
            {{ state === 'verifying' ? 'Verifying...' : 'Verify' }}
          </button>
        </div>
        <div v-if="errors.code" class="input-error">{{ errors.code }}</div>

        <div class="helper-row">
          <router-link to="/forgot-password">Forgot password?</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { sendEmailCode } from '@/api/auth'
import { ssoLogin } from '@/api/auth'
import { useUserStore } from '@/store/user'

type AuthState = 'idle' | 'code_sent' | 'verifying' | 'authenticated'

const route = useRoute()
const userStore = useUserStore()

const email = ref('')
const code = ref('')
const state = ref<AuthState>('idle')

const client = ref('')
const redirectUri = ref('')

const errors = reactive({ email: '', code: '' })

const formatClient = (c: string) => c.charAt(0).toUpperCase() + c.slice(1)

onMounted(() => {
  client.value = (route.query.client as string) || ''
  redirectUri.value = (route.query.redirect_uri as string) || ''
})

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

const canSendCode = computed(() => {
  return state.value !== 'verifying' && !errors.email && !!email.value.trim() && /^\S+@\S+\.\S+$/.test(email.value)
})

const canVerify = computed(() => {
  return (state.value === 'code_sent' || state.value === 'verifying') && !errors.email && !errors.code && /^\d{6}$/.test(code.value)
})

const handleSendCode = async () => {
  validateField('email')
  if (errors.email) return

  try {
    await sendEmailCode({ email: email.value })
    state.value = 'code_sent'
    ElMessage.success('If this email is valid, a code has been sent.')
  } catch (error: any) {
    ElMessage.error(error.msg || 'Failed to send code, please try again later')
  }
}

const handleVerify = async () => {
  validateField('email')
  validateField('code')
  if (errors.email || errors.code) return

  state.value = 'verifying'
  try {
    const loginVO = await userStore.loginWithEmailCode({ email: email.value, code: code.value })
    state.value = 'authenticated'

    const token = loginVO?.token || localStorage.getItem('token')

    if (!redirectUri.value) {
      if (import.meta.env.VITE_SSO_REDIRECT_URI) {
        redirectUri.value = import.meta.env.VITE_SSO_REDIRECT_URI
      }
    }

    if (!redirectUri.value) {
      ElMessage.success('Authenticated')
      return
    }

    const ssoRes = await ssoLogin(redirectUri.value, token || '')
    if (ssoRes.code === 0) {
      window.location.href = redirectUri.value + '?code=' + ssoRes.data
    } else {
      ElMessage.error(ssoRes.msg || 'SSO failed')
    }
  } catch (error: any) {
    state.value = 'code_sent'
    ElMessage.error(error.msg || 'Invalid or expired code')
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
  background: #f7f7f7;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: not-allowed;
  color: #666;
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
  color: #111;
  text-decoration: none;
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
