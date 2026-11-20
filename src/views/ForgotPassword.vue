<template>
  <div class="forgot-page">
    <BrandLogo class="forgot-logo" />
    <h2 class="forgot-title">{{ t('forgot.title') }}</h2>
    <form class="forgot-form" @submit.prevent="handleForgot">
      <label class="forgot-label" for="email">{{ t('auth.email') }}</label>
      <input
        id="email"
        v-model="email"
        type="email"
        autocomplete="email"
        class="forgot-input"
        required
        :placeholder="t('forgot.emailPlaceholder')"
        :disabled="loading"
        @input="sent = false"
        @blur="validateField('email')"
      />
      <div v-if="errors.email" class="input-error">{{ errors.email }}</div>
      <button class="forgot-btn" type="submit" :disabled="loading || sent">{{ t('forgot.sendResetEmail') }}</button>
      <p v-if="sent" role="status">{{ t('forgot.resetSent') }}</p>
      <div class="register-tip">
        {{ t('forgot.hasAccount') }}
        <a v-if="isChinaSso && !login.query.redirect_uri" href="https://wristo.cn/account">{{ t('register.logIn') }}</a>
        <router-link v-else :to="login">{{ t('register.logIn') }}</router-link>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { isChinaSso } from '@/config/region'
import { randomVerifier } from '@/utils/cnLogin'
import { recoveryLoginQuery, recoveryRoute, saveRecoveryContext } from '@/utils/passwordRecovery'
import { requestResetPassword } from '@/api/auth'
import BrandLogo from '@/components/BrandLogo.vue'
import { useI18n } from '@/i18n'

const route = useRoute()
const login = recoveryRoute(route, '/auth', recoveryLoginQuery(route.query))
const loading = ref(false)
const sent = ref(false)
const { t } = useI18n()
const email = ref('')
const errors = reactive({ email: '' })

function validateField(field: string) {
  if (field === 'email') {
    if (!email.value.trim()) {
      errors.email = t('validation.emailRequired')
    } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
      errors.email = t('validation.emailInvalid')
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
  if (loading.value || sent.value || !validateAll()) return
  loading.value = true
  const flowId = randomVerifier()
  try {
    await requestResetPassword(email.value.trim(), flowId)
    saveRecoveryContext(flowId, route)
    sent.value = true
  } catch {
    // The API client displays request errors.
  } finally {
    loading.value = false
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
  margin-bottom: 18px;
}
.forgot-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 32px;
  text-align: center;
}
.forgot-form {
  width: min(370px, calc(100vw - 32px));
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
