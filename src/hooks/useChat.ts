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

      let accumulatedContent = ''

      try {
        await startStream({
          url: '/v1/agent/stream',
          method: 'POST',
          body: request,
          onChunk: (chunk) => {
            accumulatedContent += chunk
            updateMessage(convId, assistantMessageId, accumulatedContent)
          },
          onDone: () => {
            setMessageStreaming(convId, assistantMessageId, false)
          },
          onError: (err) => {
            setMessageStreaming(convId, assistantMessageId, false)
            if (!accumulatedContent) {
              updateMessage(convId, assistantMessageId, `请求失败: ${err.message}`)
            }
          },
        })
      } catch {
        setMessageStreaming(convId, assistantMessageId, false)
        if (!accumulatedContent) {
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
