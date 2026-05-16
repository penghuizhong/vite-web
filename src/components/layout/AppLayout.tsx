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
