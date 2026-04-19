import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: () => void;
  description?: string;
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

/**
 * 键盘快捷键 Hook
 * 
 * 使用示例:
 * ```tsx
 * const shortcuts: KeyboardShortcut[] = [
 *   { key: 's', ctrl: true, handler: handleSave, description: '保存' },
 *   { key: 'z', ctrl: true, handler: handleUndo, description: '撤销' },
 *   { key: 'Enter', ctrl: true, handler: handlePublish, description: '发布/导出' },
 * ];
 * 
 * useKeyboardShortcuts(shortcuts);
 * ```
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enabled = true } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // 忽略在输入框中的快捷键（除了特定的全局快捷键）
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || 
                   target.tagName === 'TEXTAREA' || 
                   target.isContentEditable;

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
      const shiftMatch = !!shortcut.shift === event.shiftKey;
      const altMatch = !!shortcut.alt === event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        // 如果在输入框中，跳过某些快捷键
        if (isInput && !shortcut.ctrl && !shortcut.meta) {
          continue;
        }
        
        event.preventDefault();
        shortcut.handler();
        return;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);
};

/**
 * 创建带有撤销/重做功能的快捷键管理器
 */
export interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface UseUndoRedoOptions<T> {
  initialValue: T;
  onSave?: (value: T) => void;
  limit?: number;
}

/**
 * 带撤销/重做功能的状态 Hook
 * 
 * 使用示例:
 * ```tsx
 * const { state, setState, undo, redo, canUndo, canRedo } = useUndoRedo<string[]>({
 *   initialValue: [],
 *   onSave: saveToStorage,
 * });
 * ```
 */
export function useUndoRedo<T>(options: UseUndoRedoOptions<T>) {
  const { initialValue, onSave, limit = 50 } = options;
  
  const [history, setHistory] = useState<UndoRedoState<T>>({
    past: [],
    present: initialValue,
    future: [],
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const setState = useCallback((newValue: T | ((prev: T) => T)) => {
    setHistory(prev => {
      const resolvedValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prev.present)
        : newValue;

      // 如果值没变，不记录历史
      if (JSON.stringify(resolvedValue) === JSON.stringify(prev.present)) {
        return prev;
      }

      const newPast = [...prev.past, prev.present].slice(-limit);
      
      return {
        past: newPast,
        present: resolvedValue,
        future: [],
      };
    });
  }, [limit]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;

      const newPast = [...prev.past];
      const previous = newPast.pop()!;

      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;

      const newFuture = [...prev.future];
      const next = newFuture.shift()!;

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  // 自动保存
  useEffect(() => {
    if (onSave) {
      onSave(history.present);
    }
  }, [history.present, onSave]);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

// 需要导入 useState
import { useState } from 'react';
