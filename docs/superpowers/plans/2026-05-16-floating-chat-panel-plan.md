# Floating Chat Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port old-web's Apple-style floating chat panel UI into the vite project as a global component, with session sidebar integration and enlarged desktop dimensions.

**Architecture:** A `GlobalChatPanel` component mounted in `AppLayout` manages a floating bubble button and an animated chat panel. State is split between `uiStore` (panel open/close) and `chatStore` (conversations, messages). The panel reads the active conversation from `chatStore` and uses `useChat` for sending messages.

**Tech Stack:** React 19, Zustand, Tailwind CSS v4, lucide-react, react-markdown

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/stores/uiStore.ts` | Add `chatPanelOpen` state (modify existing) |
| `src/components/chat/ChatBubble.tsx` | Floating bubble button, fixed position, click to open |
| `src/components/chat/ChatFloatPanel.tsx` | Animated panel container with CSS transitions |
| `src/components/chat/PanelHeader.tsx` | Panel header with title, clear button, close button |
| `src/components/chat/GlobalChatPanel.tsx` | Main orchestrator: renders bubble + panel, manages input state |
| `src/components/layout/AppLayout.tsx` | Mount `GlobalChatPanel` (modify existing) |
| `src/components/layout/Sidebar.tsx` | Open panel on session click (modify existing) |
| `src/components/chat/ChatInput.tsx` | Port old-web pill-style input with Plus menu (rewrite) |
| `src/styles/globals.css` | Add floating panel animation CSS classes (modify existing) |

---

### Task 1: Add chatPanelOpen state to uiStore

**Files:**
- Modify: `src/stores/uiStore.ts`

- [ ] **Step 1: Add chatPanelOpen state and methods**

Add `chatPanelOpen`, `setChatPanelOpen`, and `toggleChatPanel` to the existing `UiStore` interface and implementation:

```typescript
// src/stores/uiStore.ts
import { create } from 'zustand'

interface UiStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  authModalOpen: boolean
  setAuthModalOpen: (open: boolean) => void
  // New fields:
  chatPanelOpen: boolean
  setChatPanelOpen: (open: boolean) => void
  toggleChatPanel: () => void
}

export const useUiStore = create<UiStore>()((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  authModalOpen: false,
  setAuthModalOpen: (open) => set({ authModalOpen: open }),
  // New fields:
  chatPanelOpen: false,
  setChatPanelOpen: (open) => set({ chatPanelOpen: open }),
  toggleChatPanel: () => set((state) => ({ chatPanelOpen: !state.chatPanelOpen })),
}))
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to uiStore.ts

---

### Task 2: Add floating panel animation CSS

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Append animation CSS classes to globals.css**

Add these CSS classes at the end of `src/styles/globals.css`, after the existing `.markdown-body blockquote` rule:

```css
/* === Floating Chat Panel Animations === */

/* Bubble button base */
.chat-bubble-btn {
  position: fixed;
  z-index: 50;
  bottom: 1.5rem;
  right: 1.5rem;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
@media (min-width: 768px) {
  .chat-bubble-btn {
    bottom: 2rem;
    right: 2rem;
  }
}
.chat-bubble-btn.hidden-bubble {
  opacity: 0;
  transform: scale(0.5);
  pointer-events: none;
}

/* Floating panel base */
.chat-float-panel {
  position: fixed;
  z-index: 50;
  bottom: 1.5rem;
  right: 1.5rem;
  background: color-mix(in oklch, var(--bg-primary) 85%, transparent);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid color-mix(in oklch, var(--border-default) 50%, transparent);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
  transform-origin: bottom right;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
@media (min-width: 768px) {
  .chat-float-panel {
    bottom: 2rem;
    right: 2rem;
  }
}

/* Closed state (bubble size) */
.chat-float-panel.closed {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  opacity: 0;
  pointer-events: none;
  transition:
    height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) 0s,
    width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) 0.25s,
    border-radius 0.3s ease 0.25s,
    opacity 0.2s ease 0.4s;
}

/* Open state (full panel) */
.chat-float-panel.open {
  width: calc(100vw - 3rem);
  height: 80vh;
  border-radius: 1.5rem;
  opacity: 1;
  pointer-events: auto;
  transition:
    opacity 0.1s ease 0s,
    width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) 0s,
    height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) 0.25s,
    border-radius 0.3s ease 0s;
}

/* Desktop dimensions: 500x812 */
@media (min-width: 768px) {
  .chat-float-panel.open {
    width: 500px;
    height: 812px;
    max-height: calc(100vh - 5rem);
    border-radius: 2rem;
  }
}

/* Content fade-in delay */
.chat-content-fade {
  opacity: 0;
  transition: opacity 0.3s ease 0s;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
.chat-float-panel.open .chat-content-fade {
  opacity: 1;
  transition-delay: 0.35s;
}
```

- [ ] **Step 2: Verify dev server still works**

Run: `npm run dev` (check in browser that styles load without errors)

---

### Task 3: Create ChatBubble component

**Files:**
- Create: `src/components/chat/ChatBubble.tsx`

- [ ] **Step 1: Create ChatBubble.tsx**

```typescript
// src/components/chat/ChatBubble.tsx
import { MessageCircle } from 'lucide-react'

interface ChatBubbleProps {
  onClick: () => void
  hidden: boolean
}

export function ChatBubble({ onClick, hidden }: ChatBubbleProps) {
  return (
    <button
      onClick={onClick}
      className={`chat-bubble-btn p-3.5 rounded-full shadow-2xl group ${
        hidden ? 'hidden-bubble' : ''
      }`}
      style={{
        background: 'color-mix(in oklch, var(--bg-primary) 90%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid color-mix(in oklch, var(--border-default) 50%, transparent)',
        color: 'var(--text-primary)',
      }}
      aria-label="唤醒 AI 助手"
    >
      <MessageCircle
        size={26}
        className="transition-colors duration-300"
        style={{ color: 'var(--text-primary)' }}
      />
    </button>
  )
}
```

---

### Task 4: Create PanelHeader component

**Files:**
- Create: `src/components/chat/PanelHeader.tsx`

- [ ] **Step 1: Create PanelHeader.tsx**

```typescript
// src/components/chat/PanelHeader.tsx
import { ChevronDown, Trash2 } from 'lucide-react'

interface PanelHeaderProps {
  hasMessages: boolean
  onClear: () => void
  onClose: () => void
}

export function PanelHeader({ hasMessages, onClear, onClose }: PanelHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 shrink-0"
      style={{
        borderBottom: '1px solid color-mix(in oklch, var(--border-default) 30%, transparent)',
        background: 'color-mix(in oklch, var(--bg-secondary) 20%, transparent)',
      }}
    >
      <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            background: '#10b981',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
          }}
        />
        服装制版 AI
      </div>
      <div className="flex items-center gap-1">
        {hasMessages && (
          <button
            onClick={onClear}
            className="p-2 rounded-full transition-colors"
            style={{
              color: 'var(--text-muted)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'color-mix(in oklch, var(--bg-tertiary) 50%, transparent)'
              e.currentTarget.style.color = '#ef4444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
            title="清空记录"
          >
            <Trash2 size={16} />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-2 rounded-full transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'color-mix(in oklch, var(--bg-tertiary) 50%, transparent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          title="收起面板"
        >
          <ChevronDown size={18} />
        </button>
      </div>
    </div>
  )
}
```

---

### Task 5: Create ChatFloatPanel component

**Files:**
- Create: `src/components/chat/ChatFloatPanel.tsx`

- [ ] **Step 1: Create ChatFloatPanel.tsx**

This component wraps the panel content with the CSS animation classes. It receives `isOpen` and renders children inside the animated container.

```typescript
// src/components/chat/ChatFloatPanel.tsx
import { ScrollArea } from '@/components/ui/scroll-area'

interface ChatFloatPanelProps {
  isOpen: boolean
  children: React.ReactNode
}

export function ChatFloatPanel({ isOpen, children }: ChatFloatPanelProps) {
  return (
    <div className={`chat-float-panel ${isOpen ? 'open' : 'closed'}`}>
      <div className="chat-content-fade">{children}</div>
    </div>
  )
}
```

**Note:** If `@/components/ui/scroll-area` does not exist in the vite project, we'll use a native div with `overflow-y-auto` instead. Let me check:

The vite project does NOT have a `scroll-area` component. We'll use a plain div:

```typescript
// src/components/chat/ChatFloatPanel.tsx
interface ChatFloatPanelProps {
  isOpen: boolean
  children: React.ReactNode
}

export function ChatFloatPanel({ isOpen, children }: ChatFloatPanelProps) {
  return (
    <div className={`chat-float-panel ${isOpen ? 'open' : 'closed'}`}>
      <div className="chat-content-fade">{children}</div>
    </div>
  )
}
```

---

### Task 6: Rewrite ChatInput with old-web pill style

**Files:**
- Modify: `src/components/chat/ChatInput.tsx`

- [ ] **Step 1: Rewrite ChatInput.tsx with old-web style**

Port the old-web `chat-input.tsx` style (pill-shaped input, Plus button with floating menu, send/stop buttons) while keeping the existing interface compatible with `ChatWindow` and `GlobalChatPanel`.

```typescript
// src/components/chat/ChatInput.tsx
import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Plus, Mic, Square } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  onStop: () => void
  disabled?: boolean
  isStreaming?: boolean
}

export function ChatInput({
  onSend,
  onStop,
  disabled = false,
  isStreaming = false,
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const plusBtnRef = useRef<HTMLButtonElement>(null)

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        plusBtnRef.current && !plusBtnRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isStreaming) return
    onSend(trimmed)
    setValue('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const hasContent = value.trim().length > 0

  return (
    <div className="relative w-full">
      {/* Floating menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 mb-3 w-[calc(100vw-2rem)] sm:w-[260px] rounded-[1.5rem] p-2 shadow-2xl z-50"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex flex-col">
            <button
              type="button"
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left group"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span className="text-lg">📎</span>
              <span className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>
                添加照片和文件
              </span>
            </button>

            <div
              className="h-[1px] mx-3 my-1"
              style={{ background: 'var(--border-default)' }}
            />

            <button
              type="button"
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left group"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span className="text-lg">🎨</span>
              <span className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>
                创建图片
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center w-full rounded-[2rem] pl-2 pr-2.5 py-2 transition-all"
        style={{
          background: 'var(--bg-primary)',
          border: hasContent
            ? '1px solid var(--accent-primary)'
            : '1px solid var(--border-default)',
        }}
      >
        <button
          type="button"
          ref={plusBtnRef}
          onClick={() => setShowMenu(!showMenu)}
          className="p-3 transition-colors rounded-full"
          style={{
            color: showMenu ? 'var(--text-primary)' : 'var(--text-muted)',
            background: showMenu ? 'var(--accent-light)' : 'transparent',
          }}
        >
          <Plus
            className="h-6 w-6 stroke-[1.5] transition-transform duration-300"
            style={{ transform: showMenu ? 'rotate(45deg)' : 'rotate(0deg)' }}
          />
        </button>

        <input
          className="flex-1 bg-transparent border-none shadow-none focus:outline-none text-[16px] px-2 disabled:opacity-50"
          style={{
            color: 'var(--text-primary)',
          }}
          placeholder="有问题，尽管问"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isStreaming}
        />

        <button
          type="button"
          className="p-3 transition-colors rounded-full disabled:opacity-50"
          style={{ color: 'var(--text-muted)' }}
          disabled={isStreaming}
        >
          <Mic className="h-[22px] w-[22px] stroke-[1.5]" />
        </button>

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="ml-1 h-11 w-11 min-w-[44px] rounded-full flex items-center justify-center transition-all duration-300 shadow-md"
            style={{
              background: '#ef4444',
              color: '#ffffff',
            }}
          >
            <Square className="h-5 w-5 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!hasContent || disabled}
            className="ml-1 h-11 w-11 min-w-[44px] rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: hasContent ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: hasContent ? '#ffffff' : 'var(--text-muted)',
              opacity: hasContent ? 1 : 0.8,
              cursor: hasContent ? 'pointer' : 'not-allowed',
            }}
          >
            <ArrowUp className="h-6 w-6 stroke-[2.5]" />
          </button>
        )}
      </form>
    </div>
  )
}
```

---

### Task 7: Create GlobalChatPanel main orchestrator

**Files:**
- Create: `src/components/chat/GlobalChatPanel.tsx`

- [ ] **Step 1: Create GlobalChatPanel.tsx**

This is the main component that orchestrates the bubble, panel, messages, and input. It reads from `chatStore` and `uiStore`, and uses `useChat` for sending messages.

```typescript
// src/components/chat/GlobalChatPanel.tsx
import { useRef, useEffect } from 'react'
import { ChatBubble } from './ChatBubble'
import { ChatFloatPanel } from './ChatFloatPanel'
import { PanelHeader } from './PanelHeader'
import { ChatInput } from './ChatInput'
import { WelcomeScreen } from './WelcomeScreen'
import { MessageItem } from './MessageItem'
import { useChatStore } from '@/stores/chatStore'
import { useUiStore } from '@/stores/uiStore'
import { useChat } from '@/hooks/useChat'

export function GlobalChatPanel() {
  const { chatPanelOpen, setChatPanelOpen } = useUiStore()
  const {
    conversations,
    activeConversationId,
    createConversation,
    setActiveConversation,
    deleteConversation,
  } = useChatStore()
  const { sendMessage, stopStream, isStreaming } = useChat()

  const scrollRef = useRef<HTMLDivElement>(null)

  // Get active conversation messages
  const activeConv = conversations.find((c) => c.id === activeConversationId)
  const messages = activeConv?.messages ?? []
  const hasMessages = messages.length > 0

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (content: string) => {
    // If no active conversation, create one first
    let convId = activeConversationId
    if (!convId) {
      convId = createConversation()
    }
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
        <PanelHeader
          hasMessages={hasMessages}
          onClear={handleClear}
          onClose={handleClose}
        />

        {/* Message area */}
        <div
          className="flex-1 p-4 md:p-5 overflow-y-auto"
          style={{ background: 'transparent' }}
        >
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
          <ChatInput
            onSend={handleSend}
            onStop={stopStream}
            isStreaming={isStreaming}
          />
        </div>
      </ChatFloatPanel>
    </>
  )
}
```

---

### Task 8: Mount GlobalChatPanel in AppLayout

**Files:**
- Modify: `src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Import and mount GlobalChatPanel**

Add `GlobalChatPanel` to the AppLayout, positioned outside the main content flow (it uses fixed positioning).

```typescript
// src/components/layout/AppLayout.tsx
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { AuthModal } from '@/components/auth/AuthModal'
import { GlobalChatPanel } from '@/components/chat/GlobalChatPanel'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const fetchUser = useAuthStore((state) => state.fetchUser)
  const { authModalOpen, setAuthModalOpen } = useUiStore()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <GlobalChatPanel />
    </div>
  )
}
```

---

### Task 9: Update Sidebar to open chat panel on session click

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Import useUiStore and add setChatPanelOpen to session click handler**

When a user clicks a conversation in the sidebar, also open the chat panel.

```typescript
// src/components/layout/Sidebar.tsx
// ... existing imports ...
import { useUiStore } from '@/stores/uiStore'

export function Sidebar() {
  // ... existing state ...
  const { sidebarOpen, setSidebarOpen, setChatPanelOpen } = useUiStore()

  // ... in the conversation click handler:
  onClick={() => {
    setActiveConversation(conv.id)
    setChatPanelOpen(true)
    setSidebarOpen(false)
  }}
```

Full updated file:

```typescript
// src/components/layout/Sidebar.tsx
import { Plus, Trash2, MessageSquare } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { useUiStore } from '@/stores/uiStore'
import { UserSection } from '@/components/auth/UserSection'

export function Sidebar() {
  const {
    conversations,
    activeConversationId,
    createConversation,
    setActiveConversation,
    deleteConversation,
  } = useChatStore()

  const { sidebarOpen, setSidebarOpen, setChatPanelOpen } = useUiStore()

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed lg:relative top-0 left-0 h-full z-40 transition-transform duration-300 ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'
        }`}
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-default)',
        }}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <button
              onClick={() => {
                createConversation()
                setSidebarOpen(false)
                setChatPanelOpen(true)
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: 'var(--accent-primary)',
                color: '#ffffff',
              }}
            >
              <Plus size={16} />
              新对话
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无对话记录</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors mb-1 ${
                    conv.id === activeConversationId ? 'bg-opacity-10' : 'hover:bg-opacity-5'
                  }`}
                  style={{
                    background:
                      conv.id === activeConversationId ? 'var(--accent-light)' : 'transparent',
                  }}
                  onClick={() => {
                    setActiveConversation(conv.id)
                    setChatPanelOpen(true)
                    setSidebarOpen(false)
                  }}
                >
                  <MessageSquare
                    size={16}
                    className="flex-shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <span
                    className="flex-1 text-sm truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {conv.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(conv.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="删除对话"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <UserSection />
        </div>
      </aside>
    </>
  )
}
```

---

### Task 10: Verify and test

**Files:**
- All modified and created files

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Start dev server and manual test**

Run: `npm run dev`

Manual test checklist:
1. Bubble button appears at bottom-right corner
2. Clicking bubble opens panel with smooth animation
3. Panel shows welcome screen when no messages
4. Sending a message creates a new conversation in sidebar
5. Clicking a sidebar conversation opens the panel with that conversation's messages
6. Desktop panel is 500x812px
7. Mobile panel is full-width with rounded corners
8. Close button collapses panel back to bubble
9. Clear button removes current conversation
10. Streaming stop button appears during AI response

---

## Self-Review

**1. Spec coverage check:**
- ✅ Floating bubble button → Task 3
- ✅ Animated panel (open/close) → Task 2 (CSS) + Task 5
- ✅ Desktop 500x812 dimensions → Task 2 CSS media query
- ✅ Session sidebar sync → Task 7 (handleSend creates conv) + Task 9 (sidebar click opens panel)
- ✅ ChatInput pill style with Plus menu → Task 6
- ✅ Panel header with clear/close → Task 4
- ✅ Global mount in AppLayout → Task 8
- ✅ uiStore state → Task 1
- ✅ Theme color adaptation → All components use var(--*) variables
- ✅ Message rendering → Task 7 reuses MessageItem + MarkdownRenderer

**2. Placeholder scan:** No TBD, TODO, or incomplete sections found.

**3. Type consistency:** All imports reference existing types and stores. `useChatStore`, `useUiStore`, `useChat` are all used consistently across tasks.
