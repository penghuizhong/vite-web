import axios from 'axios'
import { getToken, removeTokens } from '@/lib/auth'

export const client = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeTokens()
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }
    const message = error.response?.data?.detail ?? error.message ?? '未知错误'
    return Promise.reject(new Error(message))
  }
)
