<template>
  <div class="login-page">
    <div class="login-logo">
      <span class="logo-bold">Wristo<span class="logo-green">Io</span></span>
    </div>
    <h2 class="login-title">{{ client ? formatClient(client) + ' Login' : 'SSO Login' }}</h2>
    <form class="login-form" @submit.prevent="handleLogin">
      <label class="login-label" for="email">Email Address</label>
      <input
        id="email"
        v-model="email"
        type="email"
        class="login-input"
        autocomplete="username"
        required
      />

      <label class="login-label" for="password">Password</label>
      <input
        id="password"
        v-model="password"
        type="password"
        class="login-input"
        autocomplete="current-password"
        required
      />
      <div class="login-options">
        <label class="remember-me">
          <input type="checkbox" v-model="rememberMe" />
          <span>Remember me</span>
        </label>
      </div>

      <div class="register-tip">
        Forgot Password? <router-link to="/forgot-password">Reset here.</router-link>
      </div>

      <button class="login-btn" type="submit">Continue</button>
    </form>
    <div class="register-tip">
      No account? <router-link :to="{ path: '/register', query: { client: client, redirect_uri: redirectUri } }">Sign up here.</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useRoute } from 'vue-router'
import { ssoLogin } from '@/api/auth'
import { ApiResponse } from '@/types/api'

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const userStore = useUserStore()
const route = useRoute()

const client = ref('')
const redirectUri = ref('')

const formatClient = (client: string) => {
  return client.charAt(0).toUpperCase() + client.slice(1)
}

onMounted(() => {
  client.value = route.query.client as string || ''
  // 获取 URL 查询参数中的 redirect_uri
  redirectUri.value = route.query.redirect_uri as string || ''
  console.log('redirectUri', redirectUri.value)
})

const handleLogin = async () => {
  try {
    const loginRes = await userStore.login({
      email: email.value,
      password: password.value
    }) as { token?: string }
    // 登录成功后，调用 SSO 下发 code 接口
    const token = loginRes?.token || localStorage.getItem('token')
    if (!redirectUri.value) {
      if (import.meta.env.VITE_SSO_REDIRECT_URI) {
        redirectUri.value = import.meta.env.VITE_SSO_REDIRECT_URI
      } else {
        alert('缺少 redirect_uri 参数')
        return
      }
    }
    const ssoRes: ApiResponse<string> = await ssoLogin(redirectUri.value, token || '')
    if (ssoRes.code === 0) {
      window.location.href = redirectUri.value + '?code=' + ssoRes.data
    } else {
      alert(ssoRes.msg || '登录失败')
    }
  } catch (error: any) {
    console.log('error', error)
    alert(error.message || error.msg || '登录失败')
  }
}
</script>

<style scoped>
html, body {
  height: 100vh;
  overflow: hidden;
}
.login-page {
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
  .login-page {
    height: 100%;
    padding-top: 24px;
  }
}
.login-logo {
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
.login-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 32px;
  text-align: center;
}
.login-form {
  width: 370px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.login-label {
  font-weight: 800;
  margin-bottom: 4px;
  margin-top: 10px;
  text-align: left;
}
.login-input {
  padding: 12px 14px;
  border: 3px solid #d1d3d4;
  border-radius: 10px;
  font-size: 1rem;
  margin-bottom: 2px;
  background: #fff;
  outline: none;
  transition: border 0.2s;
}
.login-input:focus {
  border-color: #7ca89c;
}
.login-options {
  display: flex;
  align-items: center;
  margin: 10px 0 0 0;
}
.remember-me {
  display: flex;
  align-items: center;
  font-size: 1rem;
  font-weight: 500;
  gap: 6px;
}
.login-btn {
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
.login-btn:hover {
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