import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getToken, getRefreshToken, setTokens, removeTokens } from '@/lib/auth'
import type { TokenResponse } from '@/api/types'

let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// 1. 如果变量里不幸带了双引号，强行把双引号剥离掉
API_BASE_URL = API_BASE_URL.replace(/"/g, '').replace(/'/g, '')

// 2. 如果本地或线上死活没读取到，直接用您最正确的线上域名做最终兜底！
if (!API_BASE_URL || API_BASE_URL === '') {
  API_BASE_URL = 'https://api.fyzj.online'
}

export const client = axios.create({
  baseURL: API_BASE_URL, // 👈 注入基础路径随意支配
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: Error | null, token: string | null = null) => {
  for (const { resolve, reject } of failedQueue) {
    if (error) reject(error)
    else resolve(token)
  }
  failedQueue = []
}

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token')

  // 核心修改 2：修复原生 axios.post 不携带 baseURL 的暗坑
  const { data } = await axios.post<TokenResponse>(
    '/api/v1/auth/refresh',
    { refresh_token: refreshToken },
    { baseURL: API_BASE_URL } // 👈 必须在这里也注入，否则云端刷新 token 会报 404
  )

  setTokens(data.access_token, data.refresh_token)
  return data.access_token
}

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest._retry = true
            originalRequest.headers.Authorization = `Bearer ${token}`
            return client(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await refreshAccessToken()
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return client(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error, null)
        removeTokens()
        window.dispatchEvent(new CustomEvent('auth:logout'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response?.status === 401) {
      removeTokens()
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }

    const data = error.response?.data as Record<string, string> | undefined
    const message = data?.detail ?? error.message ?? '未知错误'
    return Promise.reject(new Error(message))
  }
)
