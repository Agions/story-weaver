import React, { ReactNode } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { SettingsProvider } from '@/context/SettingsContext';

interface AppProviderProps {
  children: ReactNode;
}

/**
 * 应用根Provider组件
 * 包含所有需要的Context Provider
 */
const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default AppProvider;