<template>
  <div class="reset-page">
    <BrandLogo class="reset-logo" />
    <h2 class="reset-title">{{ t('reset.title') }}</h2>
    <div v-if="loading" class="reset-loading">{{ t('reset.validating') }}</div>
    <div v-else>
      <div v-if="!tokenValid" class="reset-error">
        {{ t('reset.tokenFailed') }}
      </div>
      <form v-else class="reset-form" @submit.prevent="handleReset">
        <label class="reset-label" for="password">{{ t('reset.newPassword') }}</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="reset-input"
          required
          :placeholder="t('reset.newPasswordPlaceholder')"
          @blur="validateField('password')"
        />
        <div v-if="errors.password" class="input-error">{{ errors.password }}</div>
        <label class="reset-label" for="confirmPassword">{{ t('reset.confirmPassword') }}</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          class="reset-input"
          required
          :placeholder="t('reset.confirmPasswordPlaceholder')"
          @blur="validateField('confirmPassword')"
        />
        <div v-if="errors.confirmPassword" class="input-error">{{ errors.confirmPassword }}</div>
        <button class="reset-btn" type="submit">{{ t('reset.submit') }}</button>
        <div class="register-tip">
          {{ t('reset.remembered') }}
          <router-link to="/login">{{ t('register.logIn') }}</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { verifyResetToken, resetPassword } from '@/api/auth'
import BrandLogo from '@/components/BrandLogo.vue'
import { useI18n } from '@/i18n'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const loading = ref(true)
const tokenValid = ref(false)
const password = ref('')
const confirmPassword = ref('')
const errors = reactive({ password: '', confirmPassword: '' })
const token = ref('')

function validateField(field: string) {
  if (field === 'password') {
    if (!password.value.trim()) {
      errors.password = t('validation.passwordRequired')
    } else if (password.value.length < 6 || password.value.length > 20) {
      errors.password = t('validation.passwordLength')
    } else {
      errors.password = ''
    }
  } else if (field === 'confirmPassword') {
    if (confirmPassword.value !== password.value) {
      errors.confirmPassword = t('validation.passwordMismatch')
    } else {
      errors.confirmPassword = ''
    }
  }
}

function validateAll() {
  validateField('password')
  validateField('confirmPassword')
  return !errors.password && !errors.confirmPassword
}

async function validateToken() {
  token.value = route.query.token as string || ''
  if (!token.value) {
    tokenValid.value = false
    loading.value = false
    setTimeout(() => router.push('/forgot-password'), 1800)
    return
  }
  try {
    const res = await verifyResetToken(token.value)
    console.log(res)
    tokenValid.value = res.code === 0 && res.data === true
  } catch (e) {
    tokenValid.value = false
    setTimeout(() => router.push('/forgot-password'), 1800)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  validateToken()
})

const handleReset = async () => {
  if (!validateAll()) return
  try {
    await resetPassword(token.value, password.value)
    ElMessage.success(t('reset.success'))
    setTimeout(() => {
      router.push('/auth')
    }, 1200)
  } catch (error: any) {
    console.error('reset-password submit error', error)
  }
}
</script>

<style scoped>
.reset-page {
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
  .reset-page {
    height: 100%;
    padding-top: 24px;
  }
}
.reset-logo {
  margin-bottom: 18px;
}
.reset-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 32px;
  text-align: center;
}
.reset-loading {
  text-align: center;
  font-size: 1.1rem;
  color: #888;
  margin-top: 40px;
}
.reset-error {
  color: #e53935;
  font-size: 1.1rem;
  text-align: center;
  margin-top: 40px;
}
.reset-form {
  width: 370px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.reset-label {
  font-weight: 800;
  margin-bottom: 4px;
  margin-top: 10px;
  text-align: left;
}
.reset-input {
  padding: 12px 14px;
  border: 3px solid #d1d3d4;
  border-radius: 10px;
  font-size: 1rem;
  margin-bottom: 2px;
  background: #fff;
  outline: none;
  transition: border 0.2s;
}
.reset-input:focus {
  border-color: #7ca89c;
}
.input-error {
  color: #e53935;
  font-size: 0.92rem;
  margin-bottom: 2px;
  margin-top: -2px;
  min-height: 18px;
}
.reset-btn {
  margin-top: 22px;
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
.reset-btn:hover {
  background: #333;
}
.register-tip {
  text-align: center;
  margin-top: 18px;
  font-size: 1rem;
}
.register-tip a {
  color:  #111;
  text-decoration: none;
  margin-left: 4px;
}
.register-tip a:hover {
  text-decoration: underline;
}
</style> 
