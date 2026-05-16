import axios from 'axios'
import { API_BASE_URL } from '@/lib/constants'

export const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail ?? error.message ?? '未知错误'
    return Promise.reject(new Error(message))
  }
)
