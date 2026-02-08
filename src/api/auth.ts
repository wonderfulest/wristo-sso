import instance from '@/config/axios'
import type { ApiResponse, LoginVO, EmailSendCodeDTO, EmailVerifyCodeDTO } from '@/types/api'

export interface GoogleLoginDTO {
  credential: string
}

// SSO 登录下发 code
export const ssoLogin = (redirectUri: string, token: string): Promise<ApiResponse<string>> => {
  return instance.post('/sso/login', { redirectUri }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

export interface LoginByEmailDTO {
  email: string
  password: string
}

export const loginByEmail = (dto: LoginByEmailDTO): Promise<ApiResponse<LoginVO>> => {
  return instance.post('/public/auth/login/email', dto)
}

export const sendEmailCode = (dto: EmailSendCodeDTO): Promise<ApiResponse<boolean>> => {
  return instance.post('/auth/email/send-code', dto)
}

export const verifyEmailCode = (dto: EmailVerifyCodeDTO): Promise<ApiResponse<LoginVO>> => {
  return instance.post('/auth/email/verify-code', dto)
}

export const googleLogin = (dto: GoogleLoginDTO): Promise<ApiResponse<LoginVO>> => {
  return instance.post('/auth/google/login', dto)
}

export const googleOAuthCodeLogin = (code: string, redirectUri: string): Promise<ApiResponse<LoginVO>> => {
  return instance.get('/auth/google/callback', { params: { code, redirectUri } })
}

export const logout = async (): Promise<ApiResponse<string>> => {
  return instance.post('/auth/logout')
}

export interface ChangeEmailByCodeDTO {
  newEmail: string
  code: string
}

export const changeEmailByCode = (dto: ChangeEmailByCodeDTO): Promise<ApiResponse<boolean>> => {
  return instance.post('/users/change-email', dto)
}

export interface ResetPasswordByCodeDTO {
  email: string
  code: string
  newPassword: string
}

export const resetPasswordByCode = (dto: ResetPasswordByCodeDTO): Promise<ApiResponse<boolean>> => {
  return instance.post('/users/reset-password', dto)
}

// Legacy password reset flow (kept for compatibility with existing pages)
export const requestResetPassword = (email: string): Promise<ApiResponse<boolean>> => {
  return instance.post('/public/auth/reset-password/request', { email })
}

export const verifyResetToken = (token: string): Promise<ApiResponse<boolean>> => {
  return instance.get('/public/auth/reset-password/validate', { params: { token } })
}

export const resetPassword = (token: string, newPassword: string): Promise<ApiResponse<boolean>> => {
  return instance.post('/public/auth/reset-password/submit', { token, newPassword })
}

