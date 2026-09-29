import axios from 'axios'
import { translateApiMessage } from '@/i18n'
import type { CnLoginContext } from '@/utils/cnLogin'

// A dedicated client avoids attaching stale international-site bearer tokens.
const http = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15000,
  headers: { 'X-Lang': 'zh' },
})
function message(value: unknown) {
  return typeof value === 'string' && /[\u4e00-\u9fff]/.test(value)
    ? value
    : translateApiMessage(value)
}
export async function cnRequest<T>(
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  try {
    const response = await http.request({
      url: path,
      method: body === undefined ? 'GET' : 'POST',
      data: body,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    const result = response.data
    if (result.code !== 0 && result.code !== 200)
      throw new Error(message(result.msg))
    return result.data as T
  } catch (error) {
    if (axios.isAxiosError(error))
      throw new Error(
        error.response?.data?.msg
          ? message(error.response.data.msg)
          : '连接失败，请稍后重试',
      )
    throw error
  }
}
export async function emailSignIn(
  context: CnLoginContext,
  email: string,
  code: string,
) {
  const login = await cnRequest<{ token: string }>('/auth/email/verify-code', {
    email,
    code,
  })
  return authorizeEmailSession(context, login.token)
}
export async function passwordSignIn(context: CnLoginContext, email: string, password: string) {
  const login = await cnRequest<{ token: string }>('/public/auth/login/email', { email, password })
  return authorizeEmailSession(context, login.token)
}
function authorizeEmailSession(context: CnLoginContext, token: string) {
  if (!token || typeof token !== 'string' || !token.trim()) throw new Error('登录失败，请重试。')
  return cnRequest<string>(
    '/sso/login',
    {
      clientId: context.clientId || 'cn',
      redirectUri: context.redirectUri,
      codeChallenge: context.codeChallenge,
    },
    token,
  )
}
export interface SocialSignInResult {
  requiresEmail: boolean
  code: string
  redirectUri: string
  state: string
}
