<template>
  <div class="set-password-page">
    <BrandLogo class="set-password-logo" />
    <div class="set-password-context">Wristo SSO</div>
    <h1 class="set-password-title">{{ isSet ? t('setPassword.setTitle') : t('setPassword.changeTitle') }}</h1>

    <div class="set-password-card">
      <div v-if="!success">
        <div class="current-email-row" v-if="currentEmail">
          <span class="current-email-label">{{ t('setPassword.email') }}</span>
          <span class="current-email-value" :title="currentEmail">{{ currentEmail }}</span>
        </div>

        <form class="set-password-form" @submit.prevent="handleSubmit">
          <div class="verification-group">
            <button
              class="send-code-btn"
              type="button"
              :disabled="!canSendCode"
              @click="handleSendCode"
            >
              {{ sendCodeLabel }}
            </button>

            <div class="field-block">
              <label class="form-label" for="code">{{ t('auth.verificationCode') }}</label>
              <input
                id="code"
                v-model="code"
                inputmode="numeric"
                maxlength="6"
                class="form-input code-input"
                :placeholder="t('auth.codePlaceholder')"
                autocomplete="one-time-code"
                required
                :aria-invalid="!!errors.code"
                :aria-describedby="errors.code ? 'code-error' : undefined"
                :disabled="!codeSent || loading"
                @input="onCodeInput"
                @blur="validateField('code')"
              />
              <div v-if="errors.code" id="code-error" class="input-error" role="alert">{{ errors.code }}</div>
            </div>
          </div>

          <div class="field-block">
            <label class="form-label" for="newPassword">{{ t('setPassword.newPassword') }}</label>
            <input
              id="newPassword"
              v-model="newPassword"
              type="password"
              class="form-input"
              :placeholder="t('setPassword.newPasswordPlaceholder')"
              autocomplete="new-password"
              required
              :aria-invalid="!!errors.password"
              :aria-describedby="errors.password ? 'password-error' : 'password-help'"
              :disabled="loading"
              @blur="validateField('password')"
            />
            <div id="password-help" class="input-help">{{ t('validation.passwordMin') }} {{ t('validation.passwordMax') }}</div>
            <div v-if="errors.password" id="password-error" class="input-error" role="alert">{{ errors.password }}</div>
          </div>

          <div class="field-block">
            <label class="form-label" for="confirmPassword">{{ t('setPassword.confirmPassword') }}</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              class="form-input"
              :placeholder="t('setPassword.confirmPasswordPlaceholder')"
              autocomplete="new-password"
              required
              :aria-invalid="!!errors.confirmPassword"
              :aria-describedby="errors.confirmPassword ? 'confirm-password-error' : undefined"
              :disabled="loading"
              @blur="validateField('confirmPassword')"
            />
            <div v-if="errors.confirmPassword" id="confirm-password-error" class="input-error" role="alert">{{ errors.confirmPassword }}</div>
          </div>

          <button class="submit-btn" type="submit" :disabled="!canSubmit">
            {{ loading ? t('changeEmail.saving') : t('changeEmail.confirm') }}
          </button>
        </form>
      </div>

      <div v-else class="success-block">
        <div class="success-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
            <path d="M5 12.5l4.2 4.2L19.5 6.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="success-text">{{ isSet ? t('setPassword.successSet') : t('setPassword.successChanged') }}</p>
        <p class="success-hint">{{ t('changeEmail.redirecting') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sendEmailCode, resetPasswordByCode } from '@/api/auth'
import BrandLogo from '@/components/BrandLogo.vue'
import { useI18n } from '@/i18n'

const route = useRoute()
const { t } = useI18n()

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
    ElMessage.error(t('account.loginFirst'))
  }
})

function validateField(field: 'code' | 'password' | 'confirmPassword') {
  if (field === 'code') {
    if (!code.value.trim()) {
      errors.code = t('validation.codeRequired')
      return
    }
    if (!/^\d{6}$/.test(code.value)) {
      errors.code = t('validation.codeInvalid')
      return
    }
    errors.code = ''
  } else if (field === 'password') {
    if (!newPassword.value) {
      errors.password = t('validation.passwordRequired')
      return
    }
    if (newPassword.value.length < 6) {
      errors.password = t('validation.passwordMin')
      return
    }
    if (newPassword.value.length > 20) {
      errors.password = t('validation.passwordMax')
      return
    }
    errors.password = ''
    if (confirmPassword.value && confirmPassword.value !== newPassword.value) {
      errors.confirmPassword = t('validation.passwordMismatch')
    } else if (confirmPassword.value) {
      errors.confirmPassword = ''
    }
  } else if (field === 'confirmPassword') {
    if (confirmPassword.value !== newPassword.value) {
      errors.confirmPassword = t('validation.passwordMismatch')
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

const sendCodeLabel = computed(() => {
  if (sendCooldown.value > 0) {
    return t('auth.resendCodeSeconds', { seconds: sendCooldown.value })
  }
  return codeSent.value ? t('auth.resendCode') : t('setPassword.sendVerificationCode')
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
    ElMessage.error(t('setPassword.emailNotAvailable'))
    return
  }

  loading.value = true
  try {
    await sendEmailCode({ email: currentEmail.value.trim() })
    codeSent.value = true
    startCooldown()
    ElMessage.success(t('changeEmail.codeSent'))
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
    ElMessage.success(isSet.value ? t('setPassword.successSet') : t('setPassword.successChanged'))

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
  padding: 12px 20px 28px;
  box-sizing: border-box;
}

@media (max-width: 600px) {
  .set-password-page {
    padding: 18px 16px 26px;
  }
}

.set-password-logo {
  margin-bottom: 12px;
}

.set-password-context {
  color: #0f6b68;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.2;
  margin-bottom: 8px;
  text-align: center;
  text-transform: uppercase;
}

.set-password-title {
  color: #111817;
  font-size: clamp(2rem, 6vw, 2.35rem);
  font-weight: 800;
  line-height: 1.06;
  margin: 0 0 16px;
  text-align: center;
}

.set-password-card {
  width: 420px;
  max-width: calc(100vw - 40px);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #dfe7e4;
  border-radius: 8px;
  box-shadow: 0 24px 70px rgba(24, 38, 34, 0.12);
  box-sizing: border-box;
  padding: 20px;
}

.current-email-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  background: #f7faf9;
  border: 1px solid #e1ebe7;
  border-radius: 8px;
  margin-bottom: 18px;
}

.current-email-label {
  color: #596460;
  font-size: 0.82rem;
  font-weight: 750;
  line-height: 1.2;
  text-transform: uppercase;
}

.current-email-value {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 1rem;
  color: #17201d;
  font-weight: 750;
  line-height: 1.35;
}

.set-password-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.verification-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  color: #24312d;
  font-size: 0.9rem;
  font-weight: 750;
  margin-top: 4px;
  text-align: left;
}

.form-input {
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

.form-input:focus {
  border-color: #0f6b68;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(15, 107, 104, 0.13);
}

.form-input:disabled {
  background: #eef3f1;
  color: #7b8984;
  cursor: not-allowed;
}

.send-code-btn {
  min-height: 48px;
  width: 100%;
  background: #fff;
  font-size: 1rem;
  font-weight: 800;
  border: 1px solid #0f6b68;
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  color: #0f6b68;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.send-code-btn:hover {
  background: #f0f8f6;
  border-color: #0b5553;
  box-shadow: 0 8px 20px rgba(15, 107, 104, 0.12);
}

.send-code-btn:active,
.submit-btn:active {
  transform: translateY(1px);
}

.send-code-btn:disabled {
  background: #eef3f1;
  border-color: #cfd9d5;
  box-shadow: none;
  color: #7b8984;
  cursor: not-allowed;
}

.input-help {
  color: #596460;
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.4;
  text-align: left;
}

.input-error {
  color: #b42318;
  font-size: 0.9rem;
  font-weight: 650;
  line-height: 1.4;
  text-align: left;
}

.submit-btn {
  margin-top: 16px;
  min-height: 48px;
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

.submit-btn:hover {
  background: #0b5553;
  box-shadow: 0 10px 22px rgba(15, 107, 104, 0.22);
}

.submit-btn:disabled {
  background: #9aa6a2;
  box-shadow: none;
  cursor: not-allowed;
}

.success-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;
  gap: 12px;
  text-align: center;
}

.success-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #0f6b68;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 28px rgba(15, 107, 104, 0.22);
}

.success-text {
  font-size: 1.2rem;
  font-weight: 800;
  color: #17201d;
  line-height: 1.35;
  margin: 4px 0 0;
}

.success-hint {
  font-size: 0.95rem;
  color: #596460;
  line-height: 1.45;
  margin: 0;
}

button:focus-visible,
.form-input:focus-visible {
  outline: 3px solid rgba(15, 107, 104, 0.28);
  outline-offset: 2px;
}

@media (max-width: 600px) {
  .set-password-card {
    max-width: 100%;
    padding: 18px;
  }

  .set-password-title {
    font-size: 2rem;
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
