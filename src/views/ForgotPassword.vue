<template>
  <div class="forgot-page">
    <div class="forgot-logo">
      <span class="logo-bold">Wristo<span class="logo-green">Io</span></span>
    </div>
    <h2 class="forgot-title">Forgot Password</h2>
    <form class="forgot-form" @submit.prevent="handleForgot">
      <label class="forgot-label" for="email">Email Address</label>
      <input
        id="email"
        v-model="email"
        type="email"
        class="forgot-input"
        required
        placeholder="Please enter your registered email"
        @blur="validateField('email')"
      />
      <div v-if="errors.email" class="input-error">{{ errors.email }}</div>
      <button class="forgot-btn" type="submit">Send Reset Email</button>
      <div class="register-tip">
        Already have an account?
        <router-link to="/login">Log In</router-link>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { requestResetPassword } from '@/api/auth'

const router = useRouter()
const email = ref('')
const errors = reactive({ email: '' })

function validateField(field: string) {
  if (field === 'email') {
    if (!email.value.trim()) {
      errors.email = 'Email must not be blank.'
    } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
      errors.email = 'Invalid email format.'
    } else {
      errors.email = ''
    }
  }
}

function validateAll() {
  validateField('email')
  return !errors.email
}

const handleForgot = async () => {
  if (!validateAll()) return
  try {
    await requestResetPassword(email.value)
    ElMessage.success('Reset email sent, please check your inbox!')
    setTimeout(() => {
      router.push('/login')
    }, 1200)
  } catch (error: any) {
    ElMessage.error(error.msg || 'Failed to send, please try again later')
  }
}
</script>

<style scoped>
html, body {
  height: 100vh;
  overflow: hidden;
}
.forgot-page {
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
  .forgot-page {
    height: 100%;
    padding-top: 24px;
  }
}
.forgot-logo {
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
.forgot-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 32px;
  text-align: center;
}
.forgot-form {
  width: 370px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.forgot-label {
  font-weight: 800;
  margin-bottom: 4px;
  margin-top: 10px;
  text-align: left;
}
.forgot-input {
  padding: 12px 14px;
  border: 3px solid #d1d3d4;
  border-radius: 10px;
  font-size: 1rem;
  margin-bottom: 2px;
  background: #fff;
  outline: none;
  transition: border 0.2s;
}
.forgot-input:focus {
  border-color: #7ca89c;
}
.input-error {
  color: #e53935;
  font-size: 0.92rem;
  margin-bottom: 2px;
  margin-top: -2px;
  min-height: 18px;
}
.forgot-btn {
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
.forgot-btn:hover {
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