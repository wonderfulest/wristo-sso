<template>
  <div class="register-page">
    <div class="register-logo">
      <span class="logo-bold">Wristo<span class="logo-green">Io</span></span>
    </div>
    <h2 class="register-title">{{ client ? formatClient(client) + ' Sign Up' : 'Developer Sign Up' }}</h2>
    <form class="register-form" @submit.prevent="handleRegister">
      <label class="register-label" for="username">Full Name</label>
      <input
        id="username"
        v-model="username"
        type="text"
        class="register-input"
        required
        placeholder="Please enter your full name"
        @blur="validateField('username')"
      />
      <div v-if="errors.username" class="input-error">{{ errors.username }}</div>

      <label class="register-label" for="email">Email Address</label>
      <input
        id="email"
        v-model="email"
        type="email"
        class="register-input"
        required
        placeholder="Please enter your email"
        @blur="validateField('email')"
      />
      <div v-if="errors.email" class="input-error">{{ errors.email }}</div>

      <label class="register-label" for="password">Password</label>
      <input
        id="password"
        v-model="password"
        type="password"
        class="register-input"
        required
        placeholder="Please enter your password"
        @blur="validateField('password')"
      />
      <div v-if="errors.password" class="input-error">{{ errors.password }}</div>

      <label class="register-label" for="confirmPassword">Confirm Password</label>
      <input
        id="confirmPassword"
        v-model="confirmPassword"
        type="password"
        class="register-input"
        required
        placeholder="Please confirm your password"
        @blur="validateField('confirmPassword')"
      />
      <div v-if="errors.confirmPassword" class="input-error">{{ errors.confirmPassword }}</div>

      <button class="register-btn" type="submit">Continue</button>
      <div class="register-tip">
        Already have an account?
        <router-link to="/login">Log In</router-link>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const client = ref('')
const redirectUri = ref('')

const formatClient = (client: string) => {
  return client.charAt(0).toUpperCase() + client.slice(1)
}

onMounted(() => {
  client.value = route.query.client as string || ''
  redirectUri.value = route.query.redirect_uri as string || ''
})

function validateField(field: string) {
  switch (field) {
    case 'username':
      if (!username.value.trim()) {
        errors.username = 'Username must not be blank.'
      } else if (username.value.length < 4 || username.value.length > 20) {
        errors.username = 'Username length must be between 4 and 20 characters.'
      } else {
        errors.username = ''
      }
      break
    case 'password':
      if (!password.value.trim()) {
        errors.password = 'Password must not be blank.'
      } else if (password.value.length < 6 || password.value.length > 20) {
        errors.password = 'Password length must be between 6 and 20 characters.'
      } else {
        errors.password = ''
      }
      break
    case 'email':
      if (!email.value.trim()) {
        errors.email = 'Email must not be blank.'
      } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
        errors.email = 'Invalid email format.'
      } else {
        errors.email = ''
      }
      break
    case 'confirmPassword':
      if (confirmPassword.value !== password.value) {
        errors.confirmPassword = 'Passwords do not match.'
      } else {
        errors.confirmPassword = ''
      }
      break
  }
}

function validateAll() {
  validateField('username')
  validateField('email')
  validateField('password')
  validateField('confirmPassword')
  return !errors.username && !errors.email && !errors.password && !errors.confirmPassword
}

const handleRegister = async () => {
  if (!validateAll()) {
    return
  }
  try {
    await userStore.register({
      username: username.value,
      email: email.value,
      password: password.value,
      source: client.value
    })
    ElMessage.success('Registration successful, redirecting to login page...')
    setTimeout(() => {
      router.push({ path: '/login', query: route.query })
    }, 1200)
  } catch (error: any) {
    alert(error.msg || 'Registration failed')
  }
}
</script>

<style scoped>
html, body {
  height: 100vh;
  overflow: hidden;
}
.register-page {
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
  .register-page {
    height: 100%;
    padding-top: 24px;
  }
}
.register-logo {
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
.register-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 32px;
  text-align: center;
}
.register-form {
  width: 370px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.register-label {
  font-weight: 800;
  margin-bottom: 4px;
  margin-top: 10px;
  text-align: left;
}
.register-input {
  padding: 12px 14px;
  border: 3px solid #d1d3d4;
  border-radius: 10px;
  font-size: 1rem;
  margin-bottom: 2px;
  background: #fff;
  outline: none;
  transition: border 0.2s;
}
.register-input:focus {
  border-color: #7ca89c;
}
.input-error {
  color: #e53935;
  font-size: 0.92rem;
  margin-bottom: 2px;
  margin-top: -2px;
  min-height: 18px;
}
.register-btn {
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
.register-btn:hover {
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