import { create } from 'zustand'
import {
  getConversations,
  deleteConversationApi,
  createConversationApi,
  getMessages,
} from '@/api/chat'
import type { Message, Conversation, AgentMessage } from '@/types/chat'

interface ChatStore {
  conversations: Conversation[]
  activeConversationId: string | null
  isLoadingHistory: boolean
  /**
   * 已加载消息的会话ID集合（延迟加载方案3：避免重复加载）
   */
  loadedMessageConversations: Set<string>

  fetchConversations: () => Promise<void>
  /**
   * 延迟加载指定会话的消息历史（方案3：只在需要时加载）
   */
  fetchMessages: (conversationId: string) => Promise<void>
  createConversation: () => Promise<string>
  /**
   * 设置活动会话并延迟加载消息（方案1+3融合）
   */
  setActiveConversation: (id: string) => void
  deleteConversation: (id: string) => Promise<void>
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => string
  updateMessage: (conversationId: string, messageId: string, content: string) => void
  setMessageStreaming: (conversationId: string, messageId: string, isStreaming: boolean) => void
  getActiveConversation: () => Conversation | null
  clearStore: () => void
}

/**
 * 将 Agent 消息格式转换为前端 Message 格式
 */
const convertAgentMessageToMessage = (agentMsg: AgentMessage): Message => {
  return {
    id: agentMsg.run_id ?? crypto.randomUUID(),
    role: agentMsg.type === 'human' ? 'user' : 'assistant',
    content: agentMsg.content,
    timestamp: Date.now(), // 服务端没有返回时间戳，使用当前时间
    isStreaming: false,
  }
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  conversations: [],
  activeConversationId: null,
  isLoadingHistory: false,
  loadedMessageConversations: new Set(),

  fetchConversations: async () => {
    set({ isLoadingHistory: true })
    try {
      const sessions = await getConversations()
      const conversations: Conversation[] = sessions.map((s) => ({
        id: s.thread_id,
        title: s.title ?? '新对话',
        messages: [], // 初始为空，延迟加载（方案3）
        createdAt: new Date(s.created_at).getTime(),
        updatedAt: new Date(s.updated_at).getTime(),
      }))
      set({
        conversations,
        activeConversationId: conversations[0]?.id ?? null,
        isLoadingHistory: false,
        loadedMessageConversations: new Set(), // 重置已加载集合
      })
    } catch {
      set({ isLoadingHistory: false })
      throw new Error('获取会话列表失败')
    }
  },

  fetchMessages: async (conversationId: string) => {
    const { loadedMessageConversations } = get()

    // 方案3：如果已经加载过，不再重复加载
    if (loadedMessageConversations.has(conversationId)) {
      return
    }

    try {
      const agentMessages = await getMessages(conversationId)

      // 将 Agent 格式转换为前端格式
      const messages: Message[] = agentMessages.map(convertAgentMessageToMessage)

      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, messages } : c
        ),
        // 标记该会话已加载
        loadedMessageConversations: new Set(state.loadedMessageConversations).add(conversationId),
      }))
    } catch (error) {
      console.error(`加载会话 ${conversationId} 的消息历史失败:`, error)
      // 失败也标记为已加载，避免无限重试
      set((state) => ({
        loadedMessageConversations: new Set(state.loadedMessageConversations).add(conversationId),
      }))
    }
  },

  createConversation: async () => {
    try {
      // 🚨 真正的向数据库申请 ID！
      const res = await createConversationApi()
      const id = res.thread_id

      const conversation: Conversation = {
        id,
        title: '新对话',
        messages: [],
        createdAt: new Date(res.created_at).getTime(),
        updatedAt: new Date(res.updated_at).getTime(),
      }

      set((state) => ({
        conversations: [conversation, ...state.conversations],
        activeConversationId: id,
      }))

      return id
    } catch (error) {
      console.error('建档失败', error)
      throw error
    }
  },

  setActiveConversation: (id) => {
    set({ activeConversationId: id })
    // 方案1+3融合：切换会话时延迟加载消息历史
    if (id) {
      get().fetchMessages(id)
    }
  },

  deleteConversation: async (id) => {
    await deleteConversationApi(id)
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId:
        state.activeConversationId === id
          ? (state.conversations[0]?.id ?? null)
          : state.activeConversationId,
    }))
  },

  addMessage: (conversationId, messageData) => {
    const messageId = crypto.randomUUID()
    const message: Message = {
      ...messageData,
      id: messageId,
      timestamp: Date.now(),
    }
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: [...c.messages, message],
              updatedAt: Date.now(),
              title:
                c.messages.length === 0 && messageData.role === 'user'
                  ? messageData.content.slice(0, 30)
                  : c.title,
            }
          : c
      ),
    }))
    return messageId
  },

  updateMessage: (conversationId, messageId, content) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map((m) => (m.id === messageId ? { ...m, content } : m)),
            }
          : c
      ),
    })),

  setMessageStreaming: (conversationId, messageId, isStreaming) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map((m) => (m.id === messageId ? { ...m, isStreaming } : m)),
            }
          : c
      ),
    })),

  getActiveConversation: () => {
    const { conversations, activeConversationId } = get()
    return conversations.find((c) => c.id === activeConversationId) ?? null
  },

  clearStore: () =>
    set({
      conversations: [],
      activeConversationId: null,
      loadedMessageConversations: new Set(),
    }),
}))
