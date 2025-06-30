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
