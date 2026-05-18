import { client } from './client'
import type { AgentMessage } from '@/types/chat'

export interface ConversationResponse {
  thread_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface ChatHistoryResponse {
  messages: AgentMessage[]
}

export const getConversations = async (): Promise<ConversationResponse[]> => {
  const { data } = await client.get<ConversationResponse[]>('/api/v1/chat/sessions')
  return data
}

export const createConversationApi = async (): Promise<ConversationResponse> => {
  const { data } = await client.post<ConversationResponse>('/api/v1/chat/sessions')
  return data
}

export const deleteConversationApi = async (threadId: string): Promise<void> => {
  await client.delete(`/api/v1/chat/sessions/${threadId}`)
}

/**
 * 获取指定会话的消息历史（延迟加载 - 方案3）
 * 从 LangGraph checkpointer 查询 PostgreSQL 中的消息
 */
export const getMessages = async (threadId: string): Promise<AgentMessage[]> => {
  const { data } = await client.post<ChatHistoryResponse>('/v1/agent/history', {
    thread_id: threadId,
  })
  return data.messages
}
