<template>
  <div class="auth-callback">
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">{{ loadingText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { exchangeCode, TokenResponse } from '@/api/auth'
import { ApiResponse } from '@/api/types'

const router = useRouter()
const userStore = useUserStore()
const loadingText = ref('正在登录中，请稍候...')

onMounted(async () => {
  try {
    // 解析 URL 参数中的 code
    const urlParams = new URLSearchParams(window.location.search)
    const client = urlParams.get('client')
    const code = urlParams.get('code')
    const error = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')

    // 检查是否有错误
    if (error) {
      loadingText.value = `登录失败: ${errorDescription || error}`
      setTimeout(() => {
        router.replace('/login')
      }, 3000)
      return
    }

    // 检查是否有 code
    if (!code) {
      loadingText.value = '缺少授权码，请重新登录'
      setTimeout(() => {
        router.replace('/login')
      }, 3000)
      return
    }

    loadingText.value = '正在验证授权码...'

    // 将 code 发送给后端换取 access_token
    const response: ApiResponse<TokenResponse> = await exchangeCode(code, client || '')
    
    if (response.code === 200 && response.data) {
      loadingText.value = '登录成功，正在跳转...'
      
      // 保存 token 到 store 和 localStorage
      userStore.setToken(response.data.access_token)
      
      // 如果有 refresh_token，也保存
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token)
      }
      
      // 更新用户状态
      await userStore.fetchUserInfo()

      const redirectUri = `https://${client}.wristo.io/auth/result?access_token=${response.data.access_token}&id_token=${response.data.id_token}`
      
      router.replace(redirectUri)
    } else {
      throw new Error(response.msg || '换取token失败')
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    loadingText.value = `登录失败: ${error instanceof Error ? error.message : '未知错误'}`
    
    // 3秒后跳转到登录页
    setTimeout(() => {
      router.replace('/login')
    }, 3000)
  }
})
</script>

<style scoped lang="scss">
.auth-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading-container {
  text-align: center;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  min-width: 300px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.loading-text {
  color: #333;
  font-size: 16px;
  margin: 0;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 