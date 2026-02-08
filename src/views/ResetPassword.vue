<template>
  <div class="reset-page">
    <div class="reset-logo">
      <span class="logo-bold">Wristo<span class="logo-green">Io</span></span>
    </div>
    <h2 class="reset-title">Reset Password</h2>
    <div v-if="loading" class="reset-loading">Validating token...</div>
    <div v-else>
      <div v-if="!tokenValid" class="reset-error">
        Token validation failed. Redirecting to Forgot Password...
      </div>
      <form v-else class="reset-form" @submit.prevent="handleReset">
        <label class="reset-label" for="password">New Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="reset-input"
          required
          placeholder="Please enter your new password"
          @blur="validateField('password')"
        />
        <div v-if="errors.password" class="input-error">{{ errors.password }}</div>
        <label class="reset-label" for="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          class="reset-input"
          required
          placeholder="Please confirm your new password"
          @blur="validateField('confirmPassword')"
        />
        <div v-if="errors.confirmPassword" class="input-error">{{ errors.confirmPassword }}</div>
        <button class="reset-btn" type="submit">Reset Password</button>
        <div class="register-tip">
          Remembered your password?
          <router-link to="/login">Log In</router-link>
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

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const tokenValid = ref(false)
const password = ref('')
const confirmPassword = ref('')
const errors = reactive({ password: '', confirmPassword: '' })
const token = ref('')

function validateField(field: string) {
  if (field === 'password') {
    if (!password.value.trim()) {
      errors.password = 'Password must not be blank.'
    } else if (password.value.length < 6 || password.value.length > 20) {
      errors.password = 'Password length must be between 6 and 20 characters.'
    } else {
      errors.password = ''
    }
  } else if (field === 'confirmPassword') {
    if (confirmPassword.value !== password.value) {
      errors.confirmPassword = 'Passwords do not match.'
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
    ElMessage.success('Password reset successfully! Please log in.')
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
  font-size: 2.2rem;
  font-weight: bold;
  margin-bottom: 18px;
  letter-spacing: 1px;
  text-align: center;
}
.logo-bold {
  color: #222;
  font-weight: 700;
}
.logo-green {
  color: #7ca89c;
  font-weight: 700;
  margin-left: 2px;
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