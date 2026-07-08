/**
 * Theme Context — 主题状态管理
 *
 * 主题状态由 settingsStore (Zustand + persist) 作为唯一来源,
 * 通过 useSyncExternalStore 同步到 ThemeProvider。
 */
import { createContext, useContext, useEffect, ReactNode, useSyncExternalStore } from 'react';

import { useSettingsStore } from '@/shared/stores/settings.store';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  resolvedTheme: 'light' | 'dark';
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') return getSystemTheme();
  return theme;
}

function applyThemeToDOM(resolved: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.setAttribute('data-theme', resolved);
  document.body.style.backgroundColor = resolved === 'dark' ? '#141414' : '#fff';
  document.body.style.color =
    resolved === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)';
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const settingsTheme = useSyncExternalStore(
    (cb) =>
      useSettingsStore.subscribe((s, prev) => {
        if (s.settings.theme !== prev.settings.theme) cb();
      }),
    () => useSettingsStore.getState().settings.theme as Theme,
    () => useSettingsStore.getState().settings.theme as Theme
  );

  useEffect(() => {
    const resolved = resolveTheme(settingsTheme);
    applyThemeToDOM(resolved);

    // 监听系统主题变化 (仅 system 模式)
    if (settingsTheme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeToDOM(getSystemTheme());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settingsTheme]);

  const updateSettings = useSettingsStore.getState().updateSettings;
  const setTheme = (t: Theme) => updateSettings({ theme: t });
  const toggleTheme = () =>
    updateSettings({ theme: resolveTheme(settingsTheme) === 'dark' ? 'light' : 'dark' });
  const resolvedTheme = resolveTheme(settingsTheme);

  return (
    <ThemeContext.Provider
      value={{
        theme: settingsTheme,
        setTheme,
        toggleTheme,
        resolvedTheme,
        isDarkMode: resolvedTheme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};

export default ThemeProvider;
