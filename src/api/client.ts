import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getToken, getRefreshToken, setTokens, removeTokens } from '@/lib/auth'
import type { TokenResponse } from '@/api/types'

export const client = axios.create({
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

  const { data } = await axios.post<TokenResponse>('/api/v1/auth/refresh', {
    refresh_token: refreshToken,
  })
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
