interface ChatFloatPanelProps {
  isOpen: boolean
  children: React.ReactNode
}

export function ChatFloatPanel({ isOpen, children }: ChatFloatPanelProps) {
  return (
    <div className={`chat-float-panel ${isOpen ? 'open' : 'closed'}`} inert={!isOpen || undefined}>
      <div className="chat-content-fade">{children}</div>
    </div>
  )
}
