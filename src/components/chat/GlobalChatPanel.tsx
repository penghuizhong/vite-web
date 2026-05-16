import { useRef, useEffect, useMemo } from 'react'
import { ChatBubble } from './ChatBubble'
import { ChatFloatPanel } from './ChatFloatPanel'
import { PanelHeader } from './PanelHeader'
import { ChatInput } from './ChatInput'
import { MessageItem } from './MessageItem'
import { WelcomeScreen } from './WelcomeScreen'
import { useChatStore } from '@/stores/chatStore'
import { useUiStore } from '@/stores/uiStore'
import { useChat } from '@/hooks/useChat'

export function GlobalChatPanel() {
  const { chatPanelOpen, setChatPanelOpen } = useUiStore()
  const conversations = useChatStore((s) => s.conversations)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const deleteConversation = useChatStore((s) => s.deleteConversation)
  const { sendMessage, stopStream, isStreaming, error } = useChat()

  const scrollRef = useRef<HTMLDivElement>(null)

  // Get active conversation messages
  const activeConv = conversations.find((c) => c.id === activeConversationId)
  const messages = useMemo(() => activeConv?.messages ?? [], [activeConv?.messages])
  const hasMessages = messages.length > 0
  const prevMsgLength = useRef(messages.length)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > prevMsgLength.current) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMsgLength.current = messages.length
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
          {!hasMessages && !isStreaming && <WelcomeScreen onPromptClick={handleSend} />}

          <div className="flex flex-col gap-5">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            <div ref={scrollRef} className="h-4" />
          </div>
        </div>

        {/* Input area */}
        {error && (
          <div className="text-center text-sm p-3" style={{ color: 'var(--error-text, #ef4444)' }}>
            {error.message}
          </div>
        )}
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
