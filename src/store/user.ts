import { defineStore } from 'pinia'
import { login as loginApi, register as registerApi, logout as logoutApi } from '@/api/auth'
import { getUserInfo } from '@/api/user'
import { type UserInfo, type LoginResponseData, type ApiResponse } from '@/types/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null') as UserInfo | null
  }),
  actions: {
    async login(credentials: { email: string; password: string }) {
      const response: ApiResponse<LoginResponseData> = await loginApi(credentials)
      this.token = response.data?.token || ''
      this.userInfo = response.data?.userInfo || null
      localStorage.setItem('token', this.token)
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
      return response.data
    },
    async register(userData: { username: string; password: string; email: string; source: string }) {
      const response: ApiResponse<string> = await registerApi(userData)
      if (response.data) {
        return response.data
      }
      throw new Error(response.msg || '注册失败')
    },
    async logout() {
      try {
        await logoutApi()
      } catch (e) {
        // 可选：错误处理
        console.error('logout error', e)
      }
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      // 路由跳转请在组件中处理
    },
    async fetchUserInfo() {
      if (!this.token) {
        throw new Error('未登录')
      }
      const response = await getUserInfo()
      if (response.data) {
        this.userInfo = response.data
        localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
        return response.data
      }
      throw new Error(response.msg || '获取用户信息失败')
    },
    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
    }
  }
}) 