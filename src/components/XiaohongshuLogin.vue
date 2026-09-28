<template>
  <div class="xhs-login">
    <button
      v-if="!active"
      class="xhs-button"
      type="button"
      :disabled="disabled || !available"
      @click="start"
    >
      小红书扫码登录
    </button>
    <p v-if="!available" class="hint">小红书登录暂未开通，请使用邮箱登录</p>
    <div v-if="active" class="qr-panel" aria-label="小红书扫码登录">
      <p class="status" role="status">{{ statusText }}</p>
      <template v-if="qr && (status === 'pending' || status === 'scanned')">
        <img
          :src="qr"
          width="224"
          height="224"
          alt="使用小红书 App 扫描此二维码登录"
        />
        <p class="verification-code">
          验证码：<strong>{{ userCode }}</strong>
        </p>
        <p class="hint">请用小红书 App 扫码，并核对手机上的验证码。</p>
      </template>
      <button
        v-if="
          status === 'expired' || status === 'denied' || status === 'failed'
        "
        class="xhs-button"
        type="button"
        @click="start"
      >
        重新获取二维码
      </button>
      <button
        v-if="status !== 'authorized'"
        type="button"
        class="cancel"
        @click="cancel"
      >
        取消，使用其他方式登录
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import QRCode from 'qrcode'
import { cnRequest } from '@/api/cnAuth'
import { challenge, randomVerifier, type CnLoginContext } from '@/utils/cnLogin'
import {
  createXiaohongshuPolling,
  type XiaohongshuPollResult,
  type XiaohongshuStatus,
} from '@/utils/xiaohongshuPolling'

const props = defineProps<{
  context: CnLoginContext
  available: boolean
  disabled: boolean
}>()
const emit = defineEmits<{
  active: [value: boolean]
  authorized: [credentials: { attemptId: string; verifier: string }]
}>()
const active = ref(false),
  qr = ref(''),
  userCode = ref(''),
  failure = ref('')
const status = ref<XiaohongshuStatus | 'loading' | 'failed'>('loading')
const statusText = computed(
  () =>
    ({
      loading: '正在获取二维码…',
      pending: '使用小红书扫码登录',
      scanned: '已扫码，请在手机上确认',
      authorized: '授权成功，正在登录…',
      expired: '二维码已过期，请重新获取',
      denied: '你已取消小红书授权',
      failed: failure.value,
    })[status.value],
)
let generation = 0,
  attemptId = '',
  verifier = ''
const polling = createXiaohongshuPolling({
  poll: () =>
    cnRequest<XiaohongshuPollResult>('/auth/xiaohongshu/poll', {
      attemptId,
      verifier,
    }),
  onStatus: (value) => {
    status.value = value
    if (value === 'authorized') emit('authorized', { attemptId, verifier })
  },
  onError: fail,
})
function fail(error: unknown) {
  status.value = 'failed'
  failure.value =
    error instanceof Error ? error.message : '连接失败，请重新获取二维码'
}
function cancel() {
  generation++
  polling.stop()
  active.value = false
  qr.value = ''
  attemptId = ''
  verifier = ''
  emit('active', false)
}
async function start() {
  cancel()
  const current = generation
  active.value = true
  status.value = 'loading'
  emit('active', true)
  try {
    verifier = randomVerifier()
    const result = await cnRequest<{
      attemptId: string
      verificationUri: string
      userCode: string
      interval: number
      expiresIn: number
    }>('/auth/xiaohongshu/start', {
      ...props.context,
      browserChallenge: await challenge(verifier),
    })
    if (current !== generation) return
    // Render locally; never send the authorization URL to an external QR image service.
    const dataUrl = await QRCode.toDataURL(result.verificationUri, {
      width: 224,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
    if (current !== generation) return
    attemptId = result.attemptId
    userCode.value = result.userCode
    qr.value = dataUrl
    status.value = 'pending'
    polling.start(result.interval, result.expiresIn)
  } catch (error) {
    if (current === generation) fail(error)
  }
}
onUnmounted(cancel)
</script>

<style scoped>
.xhs-button {
  width: 100%;
  min-height: 48px;
  border: 0;
  border-radius: 8px;
  background: #d92343;
  color: white;
  font: inherit;
  font-weight: 650;
  padding: 10px 14px;
  cursor: pointer;
}
.xhs-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.qr-panel {
  border: 1px solid #efdadd;
  border-radius: 12px;
  padding: 16px 10px;
  background: #fffafb;
}
.qr-panel img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0 auto;
  border-radius: 8px;
}
.status {
  font-weight: 650;
  line-height: 1.5;
  margin: 0 0 12px;
}
.verification-code {
  font-size: 15px;
  margin-bottom: 6px;
}
.verification-code strong {
  letter-spacing: 2px;
}
.hint {
  color: #67736d;
  font-size: 13px;
  line-height: 1.6;
}
.cancel {
  display: block;
  margin: 12px auto 0;
  background: transparent;
  border: 0;
  color: #596460;
  text-decoration: underline;
  min-height: 44px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
</style>
