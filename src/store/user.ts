import { defineStore } from 'pinia'
import { logout as logoutApi, loginByEmail, verifyEmailCode, googleLogin as googleLoginApi, googleOAuthCodeLogin as googleOAuthCodeLoginApi } from '@/api/auth'
import type { UserInfo, LoginVO, ApiResponse, EmailVerifyCodeDTO, GoogleLoginDTO } from '@/types/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null') as UserInfo | null
  }),
  actions: {
    saveLoginResult(data: LoginVO | undefined) {
      this.token = data?.token || ''
      this.userInfo = data?.userInfo || null
      localStorage.setItem('token', this.token)
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
    },
    async loginWithPassword(dto: { email: string; password: string }) {
      const response: ApiResponse<LoginVO> = await loginByEmail(dto)
      this.saveLoginResult(response.data)
      return response.data
    },
    async loginWithEmailCode(dto: EmailVerifyCodeDTO) {
      const response: ApiResponse<LoginVO> = await verifyEmailCode(dto)
      this.saveLoginResult(response.data)
      return response.data
    },
    async register(_userData: { username: string; password: string; email: string; source: string }) {
      throw new Error('Registration is disabled in this application')
    },
    async loginWithGoogle(dto: GoogleLoginDTO) {
      const response: ApiResponse<LoginVO> = await googleLoginApi(dto)
      this.saveLoginResult(response.data)
      return response.data
    },
    async loginWithGoogleCode(code: string, redirectUri: string) {
      const response: ApiResponse<LoginVO> = await googleOAuthCodeLoginApi(code, redirectUri)
      this.saveLoginResult(response.data)
      return response.data
    },
    async logout() {
      try {
        await logoutApi()
      } catch (e) {
        console.error('logout error', e)
      }
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    },
    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
    }
  }
}) 