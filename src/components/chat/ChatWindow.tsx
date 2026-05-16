import { WelcomeScreen } from './WelcomeScreen'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { useChat } from '@/hooks/useChat'

export function ChatWindow() {
  const { sendMessage, stopStream, isStreaming, getActiveConversation, error } = useChat()

  const active = getActiveConversation()
  const messages = active?.messages ?? []

  const handleSend = (content: string) => {
    sendMessage(content)
  }

  const handlePromptClick = (prompt: string) => {
    handleSend(prompt)
  }

  return (
    <div className="flex flex-col h-full">
      {messages.length === 0 ? (
        <WelcomeScreen onPromptClick={handlePromptClick} />
      ) : (
        <MessageList messages={messages} />
      )}
      {error && (
        <div className="text-center text-sm py-1" style={{ color: 'var(--error-text, #ef4444)' }}>
          {error.message}
        </div>
      )}
      <ChatInput onSend={handleSend} onStop={stopStream} isStreaming={isStreaming} />
    </div>
  )
}
