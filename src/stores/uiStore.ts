import { create } from 'zustand'

interface UiStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  authModalOpen: boolean
  setAuthModalOpen: (open: boolean) => void
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
  chatPanelOpen: false,
  setChatPanelOpen: (open) => set({ chatPanelOpen: open }),
  toggleChatPanel: () => set((state) => ({ chatPanelOpen: !state.chatPanelOpen })),
}))
