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

// SSO 登录下发 code
export const ssoLogin = (redirectUri: string, token: string): Promise<ApiResponse<string>> => {
  console.log('ssoLogin', redirectUri, token)
  return instance.post('/public/sso/login', { redirectUri }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}
