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

      await startStream({
        url: '/v1/agent/stream',
        method: 'POST',
        body: request,
        onChunk: (chunk) => {
          const active = getActiveConversation()
          if (active) {
            const msg = active.messages.find((m) => m.id === assistantMessageId)
            if (msg) {
              updateMessage(convId, assistantMessageId, msg.content + chunk)
            }
          }
        },
        onDone: () => {
          setMessageStreaming(convId, assistantMessageId, false)
        },
        onError: () => {
          setMessageStreaming(convId, assistantMessageId, false)
        },
      })
    },
    [
      activeConversationId,
      createConversation,
      addMessage,
      startStream,
      getActiveConversation,
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
