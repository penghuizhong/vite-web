import { Plus, Trash2, MessageSquare } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { useUiStore } from '@/stores/uiStore'

export function Sidebar() {
  const {
    conversations,
    activeConversationId,
    createConversation,
    setActiveConversation,
    deleteConversation,
  } = useChatStore()

  const { sidebarOpen, setSidebarOpen } = useUiStore()

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
        </div>
      </aside>
    </>
  )
}
