/**
 * 状态管理 Hooks
 */
import { useState, useEffect, useRef, useCallback } from 'react';

import { logger } from './logger';

/** 本地存储 Hook */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error('useLocalStorage error:', error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        logger.error('useLocalStorage setValue error:', error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

/** 获取上一次渲染的值 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  /* eslint-disable react-hooks/refs */
  const prev = ref.current;
  ref.current = value;
  return prev;
  /* eslint-enable react-hooks/refs */
}

/** 组件挂载状态 */
export function useMounted(): boolean {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // eslint-disable-next-line react-hooks/refs
  return mountedRef.current;
}

/** 跳过首次渲染的 Effect */
export function useUpdateEffect(effect: React.EffectCallback, deps?: React.DependencyList): void {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** 在线状态监听 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
