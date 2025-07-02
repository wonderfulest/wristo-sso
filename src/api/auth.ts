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
  userData.roles = ['ROLE_MERCHANT']
  return instance.post('/public/auth/register', userData)
}

export const logout = async () : Promise<ApiResponse<string>> => {
  return instance.post('/public/auth/logout')
}
// SSO 回调换取 token
export const exchangeCode = (code: string, client: string): Promise<ApiResponse<TokenResponse>> => {
  return instance.post('/public/sso/token', { code, client })
}
