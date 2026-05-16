import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Message, Conversation } from '@/types/chat'

interface ChatStore {
  conversations: Conversation[]
  activeConversationId: string | null

  createConversation: () => string
  setActiveConversation: (id: string) => void
  deleteConversation: (id: string) => void
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => string
  updateMessage: (conversationId: string, messageId: string, content: string) => void
  setMessageStreaming: (conversationId: string, messageId: string, isStreaming: boolean) => void
  getActiveConversation: () => Conversation | null
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,

      createConversation: () => {
        const id = crypto.randomUUID()
        const now = Date.now()
        const conversation: Conversation = {
          id,
          title: '新对话',
          messages: [],
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
        }))
        return id
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId:
            state.activeConversationId === id
              ? (state.conversations[0]?.id ?? null)
              : state.activeConversationId,
        })),

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
    }),
    {
      name: 'patternmaking-chat-store',
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
)
