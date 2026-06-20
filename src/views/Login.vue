<template>
  <div class="login-page">
    <BrandLogo class="login-logo" />
    <h2 class="login-title">{{ t('auth.ssoLogin') }}</h2>
    <form class="login-form" @submit.prevent="handleLogin">
      <label class="login-label" for="email">{{ t('auth.email') }}</label>
      <input
        id="email"
        v-model="email"
        type="email"
        class="login-input"
        autocomplete="username"
        required
      />

      <label class="login-label" for="password">{{ t('auth.password') }}</label>
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
          <span>{{ t('auth.rememberMe') }}</span>
        </label>
      </div>

      <div class="register-tip">
        {{ t('auth.forgotPassword') }} <router-link to="/forgot-password">{{ t('auth.resetHere') }}</router-link>
      </div>

      <button class="login-btn" type="submit">{{ t('auth.continue') }}</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getSsoSession, ssoLogin } from '@/api/auth'
import { ApiResponse } from '@/types/api'
import BrandLogo from '@/components/BrandLogo.vue'
import { translateApiMessage, useI18n } from '@/i18n'
import { resolveSsoClientId } from '@/utils/ssoClient'

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const userStore = useUserStore()
const route = useRoute()
const { t } = useI18n()

const redirectUri = ref('')
const clientId = ref('store')
const nextPath = computed(() => {
  const raw = route.query.next
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' && value.startsWith('/') ? value : ''
})

const redirectWithCode = (target: string, code: string) => {
  const callbackUrl = new URL(target, window.location.origin)
  callbackUrl.searchParams.set('code', code)
  if (nextPath.value) {
    callbackUrl.searchParams.set('next', nextPath.value)
  }
  window.location.href = callbackUrl.toString()
}

onMounted(async () => {
  // 获取 URL 查询参数中的 redirect_uri
  redirectUri.value = route.query.redirect_uri as string || ''
  clientId.value = resolveSsoClientId(route.query.client, redirectUri.value)
  console.log('redirectUri', redirectUri.value)
  if (!redirectUri.value) {
    return
  }
  if (route.query.force_login === '1') {
    await userStore.logout()
    return
  }
  try {
    const session = await getSsoSession()
    if (session.code === 0 && session.data?.authenticated) {
      const ssoRes: ApiResponse<string> = await ssoLogin(clientId.value, redirectUri.value)
      if (ssoRes.code === 0 && ssoRes.data) {
        redirectWithCode(redirectUri.value, ssoRes.data)
      }
    }
  } catch (e) {
    console.info('No active SSO session', e)
  }
})

const handleLogin = async () => {
  try {
    const loginRes = await userStore.loginWithPassword({
      email: email.value,
      password: password.value
    }) as { token?: string }
    // 登录成功后，调用 SSO 下发 code 接口
    const token = loginRes?.token || localStorage.getItem('token')
    if (!redirectUri.value) {
      if (import.meta.env.VITE_WRISTO_DEFAULT_SSO_REDIRECT_URI) {
        redirectUri.value = import.meta.env.VITE_WRISTO_DEFAULT_SSO_REDIRECT_URI
      } else {
        ElMessage.error(t('auth.missingRedirectUri'))
        return
      }
    }
    const ssoRes: ApiResponse<string> = await ssoLogin(clientId.value, redirectUri.value, token || '')
    if (ssoRes.code === 0 && ssoRes.data) {
      redirectWithCode(redirectUri.value, ssoRes.data)
    } else {
      ElMessage.error(translateApiMessage(ssoRes.msg, 'auth.loginFailed'))
    }
  } catch (error: any) {
    console.error('login error', error)
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
  margin-bottom: 18px;
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
