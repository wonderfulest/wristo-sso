<template>
  <div class="set-password-page">
    <div class="set-password-logo">
      <span class="logo-bold">Wristo<span class="logo-green">Io</span></span>
    </div>

    <h2 class="set-password-title">{{ isSet ? 'Set Password' : 'Change Password' }}</h2>

    <div class="set-password-card">
      <!-- Step: Form -->
      <div v-if="!success">
        <div class="current-email-row" v-if="currentEmail">
          <span class="current-email-label">Email</span>
          <span class="current-email-value">{{ currentEmail }}</span>
        </div>

        <form class="set-password-form" @submit.prevent="handleSubmit">
          <button
            class="send-code-btn"
            type="button"
            :disabled="!canSendCode"
            @click="handleSendCode"
          >
            {{ sendCooldown > 0 ? `Resend code (${sendCooldown}s)` : (codeSent ? 'Resend code' : 'Send verification code') }}
          </button>

          <label class="form-label" for="code">Verification code</label>
          <input
            id="code"
            v-model="code"
            inputmode="numeric"
            maxlength="6"
            class="form-input code-input"
            placeholder="6-digit code"
            required
            :disabled="!codeSent || loading"
            @input="onCodeInput"
            @blur="validateField('code')"
          />
          <div v-if="errors.code" class="input-error">{{ errors.code }}</div>

          <label class="form-label" for="newPassword">New Password</label>
          <input
            id="newPassword"
            v-model="newPassword"
            type="password"
            class="form-input"
            placeholder="At least 6 characters"
            required
            :disabled="loading"
            @blur="validateField('password')"
          />
          <div v-if="errors.password" class="input-error">{{ errors.password }}</div>

          <label class="form-label" for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            class="form-input"
            placeholder="Re-enter your password"
            required
            :disabled="loading"
            @blur="validateField('confirmPassword')"
          />
          <div v-if="errors.confirmPassword" class="input-error">{{ errors.confirmPassword }}</div>

          <button class="submit-btn" type="submit" :disabled="!canSubmit">
            {{ loading ? 'Saving...' : 'Confirm' }}
          </button>
        </form>
      </div>

      <!-- Success -->
      <div v-else class="success-block">
        <div class="success-icon">&#10003;</div>
        <p class="success-text">Password {{ isSet ? 'set' : 'changed' }} successfully!</p>
        <p class="success-hint">Redirecting back...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sendEmailCode, resetPasswordByCode } from '@/api/auth'

const route = useRoute()

const currentEmail = ref('')
const code = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const codeSent = ref(false)
const sendCooldown = ref(0)
const success = ref(false)
const isSet = ref(false)

const redirectUri = ref('')

const errors = reactive({ code: '', password: '', confirmPassword: '' })

onMounted(() => {
  const token = route.query.token as string || ''
  currentEmail.value = route.query.email as string || ''
  redirectUri.value = route.query.redirect_uri as string || ''
  isSet.value = route.query.mode === 'set'

  if (token) {
    localStorage.setItem('token', token)
  }

  if (!token && !localStorage.getItem('token')) {
    ElMessage.error('Please login first')
  }
})

function validateField(field: 'code' | 'password' | 'confirmPassword') {
  if (field === 'code') {
    if (!code.value.trim()) {
      errors.code = 'Code must not be blank.'
      return
    }
    if (!/^\d{6}$/.test(code.value)) {
      errors.code = 'Invalid code format.'
      return
    }
    errors.code = ''
  } else if (field === 'password') {
    if (!newPassword.value) {
      errors.password = 'Password must not be blank.'
      return
    }
    if (newPassword.value.length < 6) {
      errors.password = 'Password must be at least 6 characters.'
      return
    }
    if (newPassword.value.length > 20) {
      errors.password = 'Password must be no more than 20 characters.'
      return
    }
    errors.password = ''
    if (confirmPassword.value && confirmPassword.value !== newPassword.value) {
      errors.confirmPassword = 'Passwords do not match.'
    } else if (confirmPassword.value) {
      errors.confirmPassword = ''
    }
  } else if (field === 'confirmPassword') {
    if (confirmPassword.value !== newPassword.value) {
      errors.confirmPassword = 'Passwords do not match.'
    } else {
      errors.confirmPassword = ''
    }
  }
}

const canSendCode = computed(() => {
  return !loading.value && sendCooldown.value === 0 && !!currentEmail.value
})

const canSubmit = computed(() => {
  return codeSent.value && !loading.value && /^\d{6}$/.test(code.value) &&
    newPassword.value.length >= 6 && newPassword.value.length <= 20 &&
    confirmPassword.value === newPassword.value &&
    !errors.code && !errors.password && !errors.confirmPassword
})

function startCooldown() {
  sendCooldown.value = 60
  const timer = setInterval(() => {
    sendCooldown.value--
    if (sendCooldown.value <= 0) clearInterval(timer)
  }, 1000)
}

function onCodeInput() {
  code.value = code.value.replace(/\D/g, '').slice(0, 6)
}

async function handleSendCode() {
  if (!currentEmail.value) {
    ElMessage.error('Email not available')
    return
  }

  loading.value = true
  try {
    await sendEmailCode({ email: currentEmail.value.trim() })
    codeSent.value = true
    startCooldown()
    ElMessage.success('Verification code sent!')
  } catch (e: any) {
    console.error('send code error', e)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  validateField('code')
  validateField('password')
  validateField('confirmPassword')
  if (errors.code || errors.password || errors.confirmPassword) return

  loading.value = true
  try {
    await resetPasswordByCode({
      email: currentEmail.value.trim(),
      code: code.value.trim(),
      newPassword: newPassword.value
    })
    success.value = true
    ElMessage.success(`Password ${isSet.value ? 'set' : 'changed'} successfully!`)

    setTimeout(() => {
      if (redirectUri.value) {
        window.location.href = redirectUri.value
      }
    }, 2000)
  } catch (e: any) {
    console.error('reset password error', e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.set-password-page {
  min-height: 100%;
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 40px;
}

@media (max-width: 600px) {
  .set-password-page {
    padding-top: 24px;
  }
}

.set-password-logo {
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

.set-password-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 22px;
  text-align: center;
}

.set-password-card {
  width: 420px;
  max-width: calc(100vw - 40px);
  background: #fff;
  border: 2px solid #e6e8ea;
  border-radius: 16px;
  padding: 24px;
}

.current-email-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  background: #f7f8fa;
  border-radius: 10px;
  margin-bottom: 18px;
}

.current-email-label {
  font-size: 0.85rem;
  color: #888;
  font-weight: 600;
}

.current-email-value {
  font-size: 1rem;
  color: #333;
  font-weight: 500;
}

.set-password-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-label {
  font-weight: 800;
  margin-bottom: 4px;
  margin-top: 6px;
  text-align: left;
}

.form-input {
  padding: 12px 14px;
  border: 3px solid #d1d3d4;
  border-radius: 10px;
  font-size: 1rem;
  margin-bottom: 2px;
  background: #fff;
  outline: none;
  transition: border 0.2s;
}

.form-input:focus {
  border-color: #7ca89c;
}

.form-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
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

.send-code-btn:hover {
  background: #333;
}

.send-code-btn:disabled {
  background: #999;
  cursor: not-allowed;
}

.input-error {
  color: #e53935;
  font-size: 0.95rem;
  margin-top: -6px;
}

.submit-btn {
  margin-top: 16px;
  width: 100%;
  background: #111;
  color: #fff;
  font-size: 1.15rem;
  font-weight: bold;
  border: none;
  border-radius: 28px;
  padding: 14px 0;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover {
  background: #333;
}

.submit-btn:disabled {
  background: #999;
  cursor: not-allowed;
}

.success-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;
  gap: 12px;
}

.success-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #7ca89c;
  color: #fff;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: #333;
}

.success-hint {
  font-size: 0.95rem;
  color: #888;
}
</style>
