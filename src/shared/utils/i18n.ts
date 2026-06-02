/**
 * frame-forge Shared Utils - i18n
 */

import { useState, useEffect, useCallback } from 'react';

export type Language = 'zh' | 'en';

interface Translations {
  [key: string]: { [key: string]: string };
}

const translations: Translations = {
  zh: {
    'app.name': 'frame-forge AI',
    'app.save': '保存',
    'app.cancel': '取消',
    'app.confirm': '确认',
    'app.delete': '删除',
    'app.edit': '编辑',
    'app.add': '添加',
    'theme.mode': '主题模式',
    'theme.light': '亮色',
    'theme.dark': '暗色',
    'theme.auto': '自动',
    'settings.title': '设置',
  },
  en: {
    'app.name': 'frame-forge AI',
    'app.save': 'Save',
    'app.cancel': 'Cancel',
    'app.confirm': 'Confirm',
    'app.delete': 'Delete',
    'app.edit': 'Edit',
    'app.add': 'Add',
    'theme.mode': 'Theme Mode',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.auto': 'Auto',
    'settings.title': 'Settings',
  },
};

const getBrowserLanguage = (): Language => {
  const navigatorLang = navigator.language.toLowerCase();
  return navigatorLang.startsWith('zh') ? 'zh' : 'en';
};

export function useTranslation() {
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('app_language') as Language) || getBrowserLanguage()
  );

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let text = translations[language]?.[key] || key;
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
        });
      }
      return text;
    },
    [language]
  );

  const changeLanguage = useCallback((newLang: Language) => {
    setLanguage(newLang);
  }, []);

  return { t, language, changeLanguage };
}
