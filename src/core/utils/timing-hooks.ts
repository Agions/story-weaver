/**
 * 计时相关 Hooks
 */
import { useState, useEffect, useCallback, useRef } from 'react';

import { debounce, throttle } from '@/shared/utils';

type GenericFunction = (...args: unknown[]) => unknown;

/** 防抖 Hook */
export function useDebounce<T extends GenericFunction>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef<T>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => debounce(callbackRef.current as GenericFunction, delay)(...args),
    [delay]
  );
}

/** 节流 Hook */
export function useThrottle<T extends GenericFunction>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef<T>(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => throttle(callbackRef.current as GenericFunction, limit)(...args),
    [limit]
  );
}

type CountdownReturn = [number, () => void, () => void, () => void];

/** 倒计时 Hook */
export function useCountdown(initialSeconds: number): CountdownReturn {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const start = useCallback(() => {
    isActiveRef.current = true;
    setIsActive(true);
  }, []);
  const pause = useCallback(() => {
    isActiveRef.current = false;
    setIsActive(false);
  }, []);
  const reset = useCallback(() => {
    isActiveRef.current = false;
    setIsActive(false);
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (isActive && seconds > 0) {
      intervalRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0 && isActiveRef.current) {
      const id = setTimeout(() => {
        isActiveRef.current = false;
        setIsActive(false);
      }, 0);
      return () => clearTimeout(id);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, seconds]);

  return [seconds, start, pause, reset];
}

/** 自动保存 Hook */
export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => void | Promise<void>,
  delay = 30000
): void {
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  useEffect(() => {
    const interval = setInterval(() => saveFunction(dataRef.current), delay);
    return () => clearInterval(interval);
  }, [saveFunction, delay]);
}
