import { create } from 'zustand'
import { login as apiLogin, register as apiRegister, getMe } from '@/api/auth'
import { setTokens, removeTokens, isAuthenticated } from '@/lib/auth'
import type { UserResponse } from '@/api/types'
import { useChatStore } from './chatStore'

interface AuthStore {
  user: UserResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, nickname: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: isAuthenticated(),

  login: async (username: string, password: string) => {
    set({ isLoading: true })
    try {
      const res = await apiLogin({ username, password })
      setTokens(res.access_token, res.refresh_token)
      set({ isAuthenticated: true, isLoading: false })
      const user = await getMe()
      set({ user })
      await useChatStore.getState().fetchConversations()
    } catch {
      set({ isLoading: false })
      throw new Error('登录失败')
    }
  },

  register: async (username: string, password: string, nickname: string) => {
    set({ isLoading: true })
    try {
      const res = await apiRegister({ username, password, nickname })
      setTokens(res.access_token, res.refresh_token)
      set({ isAuthenticated: true, isLoading: false })
      const user = await getMe()
      set({ user })
      await useChatStore.getState().fetchConversations()
    } catch {
      set({ isLoading: false })
      throw new Error('注册失败')
    }
  },

  logout: () => {
    removeTokens()
    set({ user: null, isAuthenticated: false })
    useChatStore.getState().clearStore()
    window.location.href = '/'
  },

  fetchUser: async () => {
    if (!isAuthenticated()) return
    try {
      const user = await getMe()
      set({ user })
      await useChatStore.getState().fetchConversations()
    } catch {
      removeTokens()
      set({ user: null, isAuthenticated: false })
    }
  },
}))
