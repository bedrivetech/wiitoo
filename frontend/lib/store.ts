import { create } from 'zustand';

interface UiState {
  /* Chat drawer (live streams) */
  isChatOpen: boolean;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;

  /* Sidebar (browse, following) */
  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  /* Comment sort */
  commentSort: 'top' | 'new' | 'timeline';
  setCommentSort: (sort: 'top' | 'new' | 'timeline') => void;

  /* Theatre mode (watch page) */
  theatreMode: boolean;
  setTheatreMode: (on: boolean) => void;
  toggleTheatreMode: () => void;

  /* Video ended state */
  videoEnded: boolean;
  setVideoEnded: (ended: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isChatOpen: false,
  toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen })),
  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ isChatOpen: false }),

  isSidebarOpen: true,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),

  commentSort: 'top',
  setCommentSort: (sort) => set({ commentSort: sort }),

  theatreMode: false,
  setTheatreMode: (on) => set({ theatreMode: on }),
  toggleTheatreMode: () => set((s) => ({ theatreMode: !s.theatreMode })),

  videoEnded: false,
  setVideoEnded: (ended) => set({ videoEnded: ended }),
}));