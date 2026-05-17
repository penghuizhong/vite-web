import { useCallback } from 'react'
import { useStreamSSE } from '@/hooks/useStreamSSE'
import { useChatStore } from '@/stores/chatStore'
import type { ChatRequest } from '@/types/chat'

export function useChat() {
  const {
    conversations,
    activeConversationId,
    createConversation,
    setActiveConversation,
    deleteConversation,
    addMessage,
    updateMessage,
    setMessageStreaming,
    getActiveConversation,
  } = useChatStore()

  const { isStreaming, error, startStream, stopStream } = useStreamSSE()

  const sendMessage = useCallback(
    async (content: string) => {
      let convId = activeConversationId
      if (!convId) {
        convId = createConversation()
      }

      addMessage(convId, { role: 'user', content })

      const assistantMessageId = addMessage(convId, {
        role: 'assistant',
        content: '',
        isStreaming: true,
      })

      const request: ChatRequest = {
        message: content,
        thread_id: convId,
        stream_tokens: true,
      }

      let accumulatedTokens = ''

      try {
        await startStream({
          url: '/v1/agent/stream',
          method: 'POST',
          body: request,

          // type: 'token' — 流式片段，实时拼接展示打字效果
          onToken: (token) => {
            accumulatedTokens += token
            updateMessage(convId, assistantMessageId, accumulatedTokens)
          },

          // type: 'message' — 完整消息对象，用其 content 字段替换最终内容
          // 服务端在流结束前会发一条完整的 ChatMessage，内容比 token 流更准确
          onMessage: (message) => {
            const finalContent = typeof message.content === 'string' ? message.content : null
            if (finalContent) {
              accumulatedTokens = finalContent
              updateMessage(convId, assistantMessageId, finalContent)
            }
          },

          onDone: () => {
            setMessageStreaming(convId, assistantMessageId, false)
          },

          onError: (err) => {
            setMessageStreaming(convId, assistantMessageId, false)
            if (!accumulatedTokens) {
              updateMessage(convId, assistantMessageId, `请求失败: ${err.message}`)
            }
          },
        })
      } catch {
        setMessageStreaming(convId, assistantMessageId, false)
        if (!accumulatedTokens) {
          updateMessage(convId, assistantMessageId, '请求失败，请稍后重试')
        }
      }
    },
    [
      activeConversationId,
      createConversation,
      addMessage,
      startStream,
      updateMessage,
      setMessageStreaming,
    ]
  )

  return {
    conversations,
    activeConversationId,
    isStreaming,
    error,
    createConversation,
    setActiveConversation,
    deleteConversation,
    sendMessage,
    stopStream,
    getActiveConversation,
  }
}
