<template>
  <section class="cn-auth">
    <a class="cn-brand" :href="homeUrl"
      ><img src="/wristo-mark.svg" alt="" />Wristo</a
    >
    <p class="eyebrow">{{ isStudio ? 'Wristo Studio' : '中国站' }}</p>
    <h1>{{ binding ? '关联你的 Wristo 账号' : '登录 Wristo' }}</h1>
    <p class="intro">
      {{
        binding
          ? `验证邮箱后，${providerName}和邮箱都可以登录同一个账号。已有账号请填写原邮箱。`
          : isStudio ? '登录后即可上传你的表盘设计。' : '一个账号，管理你的表盘与会员。'
      }}
    </p>
    <div class="cn-card">
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <template v-if="context && !fatal">
        <template v-if="!binding">
          <button
            class="wechat"
            :disabled="busy || xhsActive || !wechatAvailable"
            @click="startWechat"
          >
            {{ inWechat ? '微信授权登录' : '微信扫码登录' }}
          </button>
          <p v-if="!wechatAvailable" class="hint">微信登录暂未开通，请使用邮箱登录</p>
          <XiaohongshuLogin
            v-if="!isStudio"
            :context="context"
            :available="xiaohongshuAvailable"
            :disabled="busy"
            @active="xhsActive = $event"
            @authorized="onXiaohongshuAuthorized"
          />
          <div v-if="!xhsActive" class="divider">或</div>
        </template>
        <form v-if="!xhsActive" @submit.prevent="submit">
          <div v-if="!binding" class="method-copy">
            <h2>{{ loginMode === 'password' ? '使用密码登录' : '使用邮箱验证码登录' }}</h2>
            <p>{{ loginMode === 'password' ? '仅适用于已经设置过 Wristo 密码的用户。' : '未注册的邮箱验证后将自动创建账号。' }}</p>
          </div>
          <label for="cn-email">邮箱地址</label>
          <input
            id="cn-email"
            v-model="email"
            type="email"
            autocomplete="username"
            required
            :disabled="busy || xhsActive"
            placeholder="你的邮箱地址"
          />
          <template v-if="!binding && loginMode === 'password'">
            <label for="cn-password">密码</label>
            <input id="cn-password" v-model="password" type="password" autocomplete="current-password" maxlength="256" required :disabled="busy" />
          </template>
          <template v-else>
            <label for="cn-code">邮箱验证码</label>
            <div class="code-row">
              <input
                id="cn-code"
                v-model="code"
                inputmode="numeric"
                autocomplete="one-time-code"
                pattern="[0-9]{6}"
                maxlength="6"
                required
                :disabled="busy || xhsActive"
                placeholder="6 位验证码"
              />
              <button
                class="secondary"
                type="button"
                :disabled="busy || xhsActive || cooldown > 0 || !validEmail"
                @click="sendCode"
              >
                {{ cooldown ? `${cooldown} 秒后重发` : '发送验证码' }}
              </button>
            </div>
            <p v-if="notice" class="hint" role="status">{{ notice }}</p>
          </template>
          <button
            class="primary"
            :disabled="busy || xhsActive || !canSubmit"
          >
            {{
              busy ? '正在处理…' : binding ? `验证并绑定${providerName}` : '继续'
            }}
          </button>
        </form>
        <button v-if="!binding && !xhsActive" class="mode-switch" type="button" :disabled="busy" @click="switchMode">
          {{ loginMode === 'password' ? '改用邮箱验证码登录' : '改用密码登录' }}
        </button>
        <p v-if="binding" class="hint">已有会员和购买记录仍保留在原账号。</p>
        <a v-if="binding" :href="homeUrl">重新选择登录方式</a>
      </template>
      <a v-if="fatal || !context" :href="homeUrl"
        >返回后重新登录</a
      >
    </div>
    <p class="legal">
      继续即表示你同意
      <a href="https://wristo.cn/legal" target="_blank" rel="noopener"
        >用户协议与隐私政策</a
      >。
    </p>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { cnRequest, emailSignIn, passwordSignIn, type SocialSignInResult } from '@/api/cnAuth'
import XiaohongshuLogin from '@/components/XiaohongshuLogin.vue'
import {
  challenge,
  finishCnLogin,
  parseCnLogin,
  randomVerifier,
  type CnLoginContext,
} from '@/utils/cnLogin'

const route = useRoute()
const context = ref<CnLoginContext | null>(null)
const isStudio = computed(() => context.value?.clientId === 'studio' || route.query.client === 'studio')
const homeUrl = computed(() => isStudio.value ? (context.value ? new URL(context.value.redirectUri).origin : 'https://studio.wristo.cn') : 'https://wristo.cn/account')
const loginMode = ref<'password' | 'code'>('password')
const password = ref('')
const email = ref(''),
  code = ref(''),
  error = ref(''),
  notice = ref('')
const busy = ref(false),
  fatal = ref(false),
  binding = ref(false),
  cooldown = ref(0)
const inWechat = /MicroMessenger/i.test(navigator.userAgent)
const wechatAvailable = ref(false)
const xiaohongshuAvailable = ref(false), xhsActive = ref(false)
const bindingProvider = ref<'wechat' | 'xiaohongshu'>('wechat')
const providerName = computed(() => bindingProvider.value === 'xiaohongshu' ? '小红书' : '微信')
const validEmail = computed(() => /^\S+@\S+\.\S+$/.test(email.value.trim()))
const canSubmit = computed(() => validEmail.value && (!binding.value && loginMode.value === 'password' ? Boolean(password.value) : /^\d{6}$/.test(code.value)))
function switchMode() {
  if (busy.value) return
  loginMode.value = loginMode.value === 'password' ? 'code' : 'password'
  password.value = ''
  code.value = ''
  error.value = ''
  notice.value = ''
}
let timer: ReturnType<typeof setInterval> | undefined
let ticket = '',
  verifier = ''
const ATTEMPT_KEY = 'wristo:cn:wechat-attempt'
function fail(e: unknown) {
  error.value = e instanceof Error ? e.message : '操作失败，请重试'
}
onUnmounted(() => clearInterval(timer))
onMounted(async () => {
  busy.value = true
  try {
    if (route.path.endsWith('/wechat/callback')) {
      const saved = JSON.parse(sessionStorage.getItem(ATTEMPT_KEY) || 'null')
      sessionStorage.removeItem(ATTEMPT_KEY)
      window.history.replaceState(null, '', window.location.pathname)
      if (
        !saved ||
        Date.now() - saved.createdAt > 600000 ||
        saved.state !== route.query.state
      )
        throw new Error('登录已失效，请返回后重新登录。')
      context.value = saved.context
      verifier = saved.verifier
      if (route.query.error || typeof route.query.ticket !== 'string')
        throw new Error('微信授权未完成，请返回后重新登录。')
      ticket = route.query.ticket
      const result = await redeem()
      binding.value = result.requiresEmail
      if (!result.requiresEmail) completeSocialSignIn(result)
    } else {
      context.value = parseCnLogin(route.query)
      const [capabilities, xhsCapabilities] = await Promise.all([cnRequest<{
        website: boolean
        officialAccount: boolean
      }>('/auth/wechat/capabilities').catch(() => ({ website: false, officialAccount: false })),
      cnRequest<{ website: boolean }>('/auth/xiaohongshu/capabilities').catch(() => ({ website: false }))])
      xiaohongshuAvailable.value = context.value.clientId !== 'studio' && xhsCapabilities.website
      wechatAvailable.value = inWechat
        ? capabilities.officialAccount
        : capabilities.website
      // Restore a first-party SSO session when possible; CN's callback still requires its own PKCE proof.
      const session = await cnRequest<{ authenticated: boolean }>(
        '/sso/session',
      ).catch(() => null)
      if (session?.authenticated) {
        const ctx = context.value
        const code = await cnRequest<string>('/sso/login', {
          clientId: ctx.clientId || 'cn',
          redirectUri: ctx.redirectUri,
          codeChallenge: ctx.codeChallenge,
        })
        finishCnLogin(ctx, code)
      }
    }
  } catch (e) {
    fail(e)
    fatal.value = route.path.endsWith('/wechat/callback') || !context.value
  } finally {
    busy.value = false
  }
})
async function sendCode() {
  if (busy.value || cooldown.value > 0 || !validEmail.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await cnRequest('/auth/email/send-code', { email: email.value.trim() })
    notice.value = '验证码已发送，请查收邮箱。'
    cooldown.value = 60
    clearInterval(timer)
    timer = setInterval(() => {
      if (--cooldown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch (e) {
    fail(e)
  } finally {
    busy.value = false
  }
}
async function startWechat() {
  if (!context.value) return
  busy.value = true
  error.value = ''
  try {
    const state = randomVerifier(),
      verifier = randomVerifier()
    sessionStorage.setItem(
      ATTEMPT_KEY,
      JSON.stringify({
        state,
        verifier,
        context: context.value,
        createdAt: Date.now(),
      }),
    )
    const result = await cnRequest<{ authorizationUrl: string }>(
      '/auth/wechat/start',
      {
        channel: inWechat ? 'official-account' : 'website',
        browserState: state,
        browserChallenge: await challenge(verifier),
        ...context.value,
      },
    )
    window.location.assign(result.authorizationUrl)
  } catch (e) {
    fail(e)
    busy.value = false
  }
}
async function redeem(withEmail = false) {
  return cnRequest<SocialSignInResult>(`/auth/${bindingProvider.value}/redeem`, {
    ...(bindingProvider.value === 'xiaohongshu' ? { attemptId: ticket } : { ticket }),
    verifier,
    ...(withEmail
      ? { email: { email: email.value.trim(), code: code.value } }
      : {}),
  })
}
async function onXiaohongshuAuthorized(credentials: { attemptId: string; verifier: string }) {
  busy.value = true
  error.value = ''
  bindingProvider.value = 'xiaohongshu'
  ticket = credentials.attemptId
  verifier = credentials.verifier
  try {
    const result = await redeem()
    binding.value = result.requiresEmail
    if (!result.requiresEmail) completeSocialSignIn(result)
  } catch (e) {
    fail(e)
    fatal.value = true
  } finally {
    xhsActive.value = false
    busy.value = false
  }
}
function completeSocialSignIn(result: SocialSignInResult) {
  if (
    !context.value ||
    result.redirectUri !== context.value.redirectUri ||
    result.state !== context.value.state ||
    !result.code
  )
    throw new Error('登录回调不匹配，请重新登录。')
  finishCnLogin(context.value, result.code)
}
async function submit() {
  if (!context.value || busy.value || !canSubmit.value) return
  busy.value = true
  error.value = ''
  try {
    if (binding.value) completeSocialSignIn(await redeem(true))
    else
      finishCnLogin(
        context.value,
        loginMode.value === 'password'
          ? await passwordSignIn(context.value, email.value.trim(), password.value)
          : await emailSignIn(context.value, email.value.trim(), code.value),
      )
  } catch (e) {
    fail(e)
    busy.value = false
  } finally {
    password.value = ''
  }
}
</script>
<style scoped>
.cn-auth {
  color-scheme: light;
  width: 100%;
  max-width: 460px;
  margin: auto;
  padding: 28px 20px;
  box-sizing: border-box;
  text-align: center;
  color: #17201d;
}
.cn-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 28px;
  font-weight: 800;
  color: inherit;
  text-decoration: none;
}
.cn-brand img {
  width: 36px;
  height: 36px;
}
.eyebrow {
  color: #0f6b68;
  font-size: 14px;
  margin: 18px 0 8px;
}
h1 {
  font-size: 30px;
  margin: 0;
}
.intro {
  color: #596460;
  line-height: 1.65;
  margin: 12px 0 24px;
}
.cn-card {
  background: white;
  border: 1px solid #dfe7e4;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 16px 48px #183e2910;
}
form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}
label {
  font-size: 14px;
  font-weight: 650;
  margin-top: 8px;
}
input,
button {
  font: inherit;
  box-sizing: border-box;
  border-radius: 8px;
  min-height: 48px;
}
input {
  background: #fff;
  color: #17201d;
  width: 100%;
  min-width: 0;
  border: 1px solid #cdd9d5;
  padding: 12px;
}
input:focus {
  outline: 2px solid #0f6b68;
  outline-offset: 2px;
}
button {
  cursor: pointer;
  font-weight: 650;
  padding: 10px 14px;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.wechat,
.primary {
  width: 100%;
  border: 0;
  color: white;
  background: #0f6b68;
}
.wechat {
  background: #168445;
}
.wechat + :deep(.xhs-login) { margin-top: 12px; }
.primary {
  margin-top: 10px;
}
.secondary {
  white-space: nowrap;
  border: 1px solid #cdd9d5;
  background: #f5faf8;
  color: #0f6b68;
  font-size: 14px;
}
.code-row {
  display: flex;
  gap: 8px;
}
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 22px 0;
  color: #738078;
  font-size: 13px;
}
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #dfe7e4; }
.method-copy h2 { margin: 0 0 6px; font-size: 18px; }
.method-copy p { margin: 0 0 6px; color: #67736d; font-size: 14px; line-height: 1.6; }
.mode-switch { width: 100%; margin-top: 12px; border: 0; background: transparent; color: #0f6b68; }
.mode-switch:hover:not(:disabled) { text-decoration: underline; }
.hint,
.legal {
  font-size: 13px;
  line-height: 1.6;
  color: #67736d;
}
.error {
  color: #a52b25;
  background: #fff1ef;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
}
a {
  color: #0f6b68;
}
.legal {
  margin-top: 20px;
}
@media (max-width: 380px) {
  .cn-card {
    padding: 18px;
  }
  .cn-auth {
    padding: 20px 16px;
  }
}
</style>
