<template>
  <div class="change-email-page">
    <div class="change-email-logo">
      <span class="logo-bold">Wristo<span class="logo-green">Io</span></span>
    </div>

    <h2 class="change-email-title">Change Email</h2>

    <div class="change-email-card">
      <!-- Step 1: Enter new email & send code -->
      <div v-if="!success">
        <div class="current-email-row" v-if="currentEmail">
          <span class="current-email-label">Current email</span>
          <span class="current-email-value">{{ currentEmail }}</span>
        </div>

        <form class="change-email-form" @submit.prevent="handleChangeEmail">
          <label class="form-label" for="newEmail">New email address</label>
          <input
            id="newEmail"
            v-model="newEmail"
            type="email"
            class="form-input"
            autocomplete="email"
            required
            :disabled="loading"
            placeholder="Enter your new email"
            @blur="validateField('email')"
          />
          <div v-if="errors.email" class="input-error">{{ errors.email }}</div>

          <button
            class="send-code-btn"
            type="button"
            :disabled="!canSendCode"
            @click="handleSendCode"
          >
            {{ sendCooldown > 0 ? `Resend code (${sendCooldown}s)` : (codeSent ? 'Resend code' : 'Send code') }}
          </button>

          <label class="form-label" for="code">Verification code</label>
          <div class="code-row">
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
            <button class="verify-btn" type="submit" :disabled="!canSubmit">
              {{ loading ? 'Saving...' : 'Confirm' }}
            </button>
          </div>
          <div v-if="errors.code" class="input-error">{{ errors.code }}</div>
        </form>
      </div>

      <!-- Step 2: Success -->
      <div v-else class="success-block">
        <div class="success-icon">&#10003;</div>
        <p class="success-text">Email changed successfully!</p>
        <p class="success-hint">Redirecting back...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sendEmailCode, changeEmailByCode } from '@/api/auth'

const route = useRoute()

const currentEmail = ref('')
const newEmail = ref('')
const code = ref('')
const loading = ref(false)
const codeSent = ref(false)
const sendCooldown = ref(0)
const success = ref(false)

const redirectUri = ref('')

const errors = reactive({ email: '', code: '' })

onMounted(() => {
  const token = route.query.token as string || ''
  currentEmail.value = route.query.email as string || ''
  redirectUri.value = route.query.redirect_uri as string || ''

  if (token) {
    localStorage.setItem('token', token)
  }

  if (!token && !localStorage.getItem('token')) {
    ElMessage.error('Please login first')
  }
})

function validateField(field: 'email' | 'code') {
  if (field === 'email') {
    if (!newEmail.value.trim()) {
      errors.email = 'Email must not be blank.'
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(newEmail.value)) {
      errors.email = 'Invalid email format.'
      return
    }
    if (newEmail.value.trim().toLowerCase() === currentEmail.value.toLowerCase()) {
      errors.email = 'New email must be different from current email.'
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
  return !loading.value && sendCooldown.value === 0 && !errors.email && !!newEmail.value.trim() && /^\S+@\S+\.\S+$/.test(newEmail.value)
})

const canSubmit = computed(() => {
  return codeSent.value && !loading.value && !errors.email && !errors.code && /^\d{6}$/.test(code.value)
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
  validateField('email')
  if (errors.email) return

  loading.value = true
  try {
    await sendEmailCode({ email: newEmail.value.trim() })
    codeSent.value = true
    startCooldown()
    ElMessage.success('Verification code sent!')
  } catch (e: any) {
    console.error('change-email send code error', e)
  } finally {
    loading.value = false
  }
}

async function handleChangeEmail() {
  validateField('email')
  validateField('code')
  if (errors.email || errors.code) return

  loading.value = true
  try {
    await changeEmailByCode({
      newEmail: newEmail.value.trim(),
      code: code.value.trim()
    })
    success.value = true
    ElMessage.success('Email changed successfully!')

    setTimeout(() => {
      if (redirectUri.value) {
        window.location.href = redirectUri.value
      }
    }, 2000)
  } catch (e: any) {
    console.error('change-email submit error', e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.change-email-page {
  min-height: 100%;
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 40px;
}

@media (max-width: 600px) {
  .change-email-page {
    padding-top: 24px;
  }
}

.change-email-logo {
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

.change-email-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 22px;
  text-align: center;
}

.change-email-card {
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

.change-email-form {
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

.input-error {
  color: #e53935;
  font-size: 0.95rem;
  margin-top: -6px;
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
