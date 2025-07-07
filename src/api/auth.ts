import instance from '@/config/axios'
import type { ApiResponse, LoginResponseData } from '@/types/api'
export interface LoginCredentialsDto {
  email: string
  password: string
}
export interface RegisterDto {
  username: string
  password: string
  email: string
  source: string // 来源，如：web, app, sso
  roles?: string[]
}

export interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  id_token?: string
}

// SSO 登录下发 code
export const ssoLogin = (redirectUri: string, token: string): Promise<ApiResponse<string>> => {
  console.log('ssoLogin', redirectUri, token)
  return instance.post('/sso/login', { redirectUri }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

export const login = (credentials: LoginCredentialsDto) : Promise<ApiResponse<LoginResponseData>> => {
  return instance.post('/public/auth/login/email', credentials)
}

export const register =  (userData: RegisterDto) : Promise<ApiResponse<string>> => {
  userData.roles = ['ROLE_USER']
  return instance.post('/public/auth/register', userData)
}

export const logout = async () : Promise<ApiResponse<string>> => {
  return instance.post('/public/auth/logout')
}
// SSO 回调换取 token
export const exchangeCode = (code: string, client: string): Promise<ApiResponse<TokenResponse>> => {
  return instance.post('/public/sso/token', { code, client })
}

// 发送重置密码邮件
export const requestResetPassword = (email: string): Promise<ApiResponse<boolean>> => {
  return instance.post('/public/auth/reset-password/request', { email })
}

// 验证重置 token
export const verifyResetToken = (token: string): Promise<ApiResponse<boolean>> => {
  return instance.get('/public/auth/reset-password/validate', { params: { token } })
}

// 提交新密码
export const resetPassword = (token: string, newPassword: string): Promise<ApiResponse<boolean>> => {
  return instance.post('/public/auth/reset-password/submit', { token, newPassword })
}

