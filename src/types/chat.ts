export type MessageRole = 'user' | 'assistant'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  isStreaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface ChatRequest {
  message: string
  conversation_id: string | null
  context?: Record<string, unknown>
}

export interface SSEChunk {
  content?: string
  text?: string
}
