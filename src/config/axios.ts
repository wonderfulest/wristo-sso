import axios from 'axios'
import { ElMessage } from 'element-plus'
import { BizErrorCode } from '@/constant/errorCode'
import type { ApiResponse } from '@/types/api'
import { redirectToAuthPage } from '@/utils/authRedirect'
import { translateMessage } from '@/i18n'

const instance = axios.create({
  baseURL: '/api', // 走 vite 代理
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    const res: ApiResponse<any> = response.data
    if (res.code === BizErrorCode.SUCCESS) {
      return response.data // 返回原始 response
    } else {
      ElMessage.error(response.data.msg || translateMessage('error.requestFailed'))
      return Promise.reject(response.data)
    }
  },
  error => {
    const status = error.response?.status
    if (status === 401 || status === 403) {
      ElMessage.error(translateMessage('error.sessionExpired'))
      redirectToAuthPage()
    } else {
      ElMessage.error(translateMessage('error.network'))
    }
    return Promise.reject(error)
  }
)

export default instance
