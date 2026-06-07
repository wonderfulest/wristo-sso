<template>
  <div class="register-page">
    <BrandLogo class="register-logo" />
    <h2 class="register-title">{{ t('register.title') }}</h2>
    <form class="register-form" @submit.prevent="handleRegister">
      <label class="register-label" for="username">{{ t('register.fullName') }}</label>
      <input
        id="username"
        v-model="username"
        type="text"
        class="register-input"
        required
        :placeholder="t('register.fullNamePlaceholder')"
        @blur="validateField('username')"
      />
      <div v-if="errors.username" class="input-error">{{ errors.username }}</div>

      <label class="register-label" for="email">{{ t('auth.email') }}</label>
      <input
        id="email"
        v-model="email"
        type="email"
        class="register-input"
        required
        :placeholder="t('register.emailPlaceholder')"
        @blur="validateField('email')"
      />
      <div v-if="errors.email" class="input-error">{{ errors.email }}</div>

      <label class="register-label" for="password">{{ t('auth.password') }}</label>
      <input
        id="password"
        v-model="password"
        type="password"
        class="register-input"
        required
        :placeholder="t('register.passwordPlaceholder')"
        @blur="validateField('password')"
      />
      <div v-if="errors.password" class="input-error">{{ errors.password }}</div>

      <label class="register-label" for="confirmPassword">{{ t('register.confirmPassword') }}</label>
      <input
        id="confirmPassword"
        v-model="confirmPassword"
        type="password"
        class="register-input"
        required
        :placeholder="t('register.confirmPasswordPlaceholder')"
        @blur="validateField('confirmPassword')"
      />
      <div v-if="errors.confirmPassword" class="input-error">{{ errors.confirmPassword }}</div>

      <button class="register-btn" type="submit">{{ t('auth.continue') }}</button>
      <div class="register-tip">
        {{ t('register.hasAccount') }}
        <router-link to="/login">{{ t('register.logIn') }}</router-link>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import BrandLogo from '@/components/BrandLogo.vue'
import { useI18n } from '@/i18n'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()

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

onMounted(() => {
  client.value = route.query.client as string || ''
  redirectUri.value = route.query.redirect_uri as string || ''
})

function validateField(field: string) {
  switch (field) {
    case 'username':
      if (!username.value.trim()) {
        errors.username = t('validation.usernameRequired')
      } else if (username.value.length < 4 || username.value.length > 20) {
        errors.username = t('validation.usernameLength')
      } else {
        errors.username = ''
      }
      break
    case 'password':
      if (!password.value.trim()) {
        errors.password = t('validation.passwordRequired')
      } else if (password.value.length < 6 || password.value.length > 20) {
        errors.password = t('validation.passwordLength')
      } else {
        errors.password = ''
      }
      break
    case 'email':
      if (!email.value.trim()) {
        errors.email = t('validation.emailRequired')
      } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
        errors.email = t('validation.emailInvalid')
      } else {
        errors.email = ''
      }
      break
    case 'confirmPassword':
      if (confirmPassword.value !== password.value) {
        errors.confirmPassword = t('validation.passwordMismatch')
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
    ElMessage.success(t('register.success'))
    setTimeout(() => {
      router.push({ path: '/login', query: route.query })
    }, 1200)
  } catch (error: any) {
    alert(error.msg || t('register.failed'))
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
  margin-bottom: 18px;
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
