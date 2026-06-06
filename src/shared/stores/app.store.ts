/**
 * 应用状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AIModel } from '@/shared/types';

export interface AppState {
  // UI 状态
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: 'zh' | 'en';

  // 当前选中
  currentProjectId: string | null;
  currentModel: AIModel | null;

  // 全局加载状态
  isLoading: boolean;
  loadingMessage: string;

  // 通知
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>;

  // Actions
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setLanguage: (language: 'zh' | 'en') => void;
  setCurrentProject: (projectId: string | null) => void;
  setCurrentModel: (model: AIModel | null) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

// Track notification auto-dismiss timers outside the store to avoid serialization issues
const notificationTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      sidebarCollapsed: false,
      theme: 'auto',
      language: 'zh',
      currentProjectId: null,
      currentModel: null,
      isLoading: false,
      loadingMessage: '',
      notifications: [],

      // Actions
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),

      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => set({ language }),

      setCurrentProject: (projectId) =>
        set({
          currentProjectId: projectId,
        }),

      setCurrentModel: (model) =>
        set({
          currentModel: model,
        }),

      setLoading: (isLoading, message = '') =>
        set({
          isLoading,
          loadingMessage: message,
        }),

      addNotification: (notification) => {
        const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id }],
        }));

        // 自动移除 — track timer so it can be cleared if notification is manually removed
        const duration = notification.duration ?? 3000;
        const timer = setTimeout(() => {
          notificationTimers.delete(id);
          // Check the notification still exists before removing (may have been manually removed)
          if (get().notifications.some((n) => n.id === id)) {
            get().removeNotification(id);
          }
        }, duration);
        notificationTimers.set(id, timer);
      },

      removeNotification: (id) => {
        // Clear any pending auto-dismiss timer for this notification
        const timer = notificationTimers.get(id);
        if (timer !== undefined) {
          clearTimeout(timer);
          notificationTimers.delete(id);
        }
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearAllNotifications: () => {
        // Clear all pending timers
        notificationTimers.forEach((timer) => clearTimeout(timer));
        notificationTimers.clear();
        set({ notifications: [] });
      },
    }),
    {
      name: 'framefab-app-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        language: state.language,
        currentProjectId: state.currentProjectId,
        currentModel: state.currentModel,
      }),
    }
  )
);
