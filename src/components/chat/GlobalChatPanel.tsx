import { useRef, useEffect, useMemo } from 'react'
import { ChatBubble } from './ChatBubble'
import { ChatFloatPanel } from './ChatFloatPanel'
import { PanelHeader } from './PanelHeader'
import { ChatInput } from './ChatInput'
import { MessageItem } from './MessageItem'
import { useChatStore } from '@/stores/chatStore'
import { useUiStore } from '@/stores/uiStore'
import { useChat } from '@/hooks/useChat'

export function GlobalChatPanel() {
  const { chatPanelOpen, setChatPanelOpen } = useUiStore()
  const { conversations, activeConversationId, deleteConversation } = useChatStore()
  const { sendMessage, stopStream, isStreaming } = useChat()

  const scrollRef = useRef<HTMLDivElement>(null)

  // Get active conversation messages
  const activeConv = conversations.find((c) => c.id === activeConversationId)
  const messages = useMemo(() => activeConv?.messages ?? [], [activeConv?.messages])
  const hasMessages = messages.length > 0

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (content: string) => {
    sendMessage(content)
    // Open panel if not already open
    if (!chatPanelOpen) {
      setChatPanelOpen(true)
    }
  }

  const handleClear = () => {
    if (activeConversationId) {
      deleteConversation(activeConversationId)
    }
  }

  const handleClose = () => {
    setChatPanelOpen(false)
  }

  const handleBubbleClick = () => {
    setChatPanelOpen(true)
  }

  return (
    <>
      {/* Floating bubble button */}
      <ChatBubble onClick={handleBubbleClick} hidden={chatPanelOpen} />

      {/* Floating panel */}
      <ChatFloatPanel isOpen={chatPanelOpen}>
        {/* Header */}
        <PanelHeader hasMessages={hasMessages} onClear={handleClear} onClose={handleClose} />

        {/* Message area */}
        <div className="flex-1 p-4 md:p-5 overflow-y-auto" style={{ background: 'transparent' }}>
          {!hasMessages && !isStreaming && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div
                className="w-14 h-14 rounded-3xl flex items-center justify-center mb-4"
                style={{
                  background: 'color-mix(in oklch, var(--bg-secondary) 50%, transparent)',
                  border: '1px solid color-mix(in oklch, var(--border-default) 50%, transparent)',
                }}
              >
                <span className="text-2xl">✂️</span>
              </div>
              <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                随身制版顾问
              </p>
              <p
                className="text-sm leading-relaxed max-w-[200px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                有任何版型问题随时问我
              </p>
            </div>
          )}

          <div className="flex flex-col gap-5">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            <div ref={scrollRef} className="h-4" />
          </div>
        </div>

        {/* Input area */}
        <div
          className="p-3 shrink-0"
          style={{
            borderTop: '1px solid color-mix(in oklch, var(--border-default) 30%, transparent)',
            background: 'color-mix(in oklch, var(--bg-primary) 50%, transparent)',
          }}
        >
          <ChatInput onSend={handleSend} onStop={stopStream} isStreaming={isStreaming} />
        </div>
      </ChatFloatPanel>
    </>
  )
}
