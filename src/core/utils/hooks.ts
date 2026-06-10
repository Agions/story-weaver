/**
 * 通用 Hooks（facade）
 *
 * 按职责拆分为 3 个子模块，本文件仅做 re-export 保持向后兼容。
 */

// 计时相关：防抖、节流、倒计时、自动保存
export { useDebounce, useThrottle, useCountdown, useAutoSave } from './timing-hooks';

// DOM 相关：窗口大小、点击外部、键盘、媒体查询、滚动、可见性
export {
  useWindowSize,
  useClickOutside,
  useKeyPress,
  useMediaQuery,
  useScrollPosition,
  useVisibility,
} from './dom-hooks';
export type { WindowSize } from './dom-hooks';

// 状态管理：本地存储、上一状态、挂载状态、更新效果、在线状态
export {
  useLocalStorage,
  usePrevious,
  useMounted,
  useUpdateEffect,
  useOnlineStatus,
} from './state-hooks';
