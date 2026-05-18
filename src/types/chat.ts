export type MessageRole = 'user' | 'assistant'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  isStreaming?: boolean
}

// Agent 服务返回的消息格式
export type AgentMessageType = 'human' | 'ai' | 'tool' | 'custom'

export interface AgentMessage {
  type: AgentMessageType
  content: string
  tool_calls?: Array<{
    name: string
    args: Record<string, unknown>
    id?: string
    type: 'tool_call'
  }>
  tool_call_id?: string
  run_id?: string
  response_metadata?: Record<string, unknown>
  custom_data?: Record<string, unknown>
}

export interface ChatHistoryResponse {
  messages: AgentMessage[]
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
  thread_id: string | null
  stream_tokens?: boolean
}

export interface SSEChunk {
  content?: string
  text?: string
}
