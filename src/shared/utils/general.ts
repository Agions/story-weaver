/**
 * frame-fab Shared Utils - General Utilities (facade)
 *
 * 按职责拆分为 6 个子模块，本文件仅做 re-export 保持向后兼容。
 */

// 计时工具：防抖、节流、延迟、重试
export { debounce, throttle, delay, retry, PROCESSING_DELAY_MS } from './timing';

// 数据工具：深拷贝、ID 生成、安全解析、哈希、错误提取
export {
  deepClone,
  generateId,
  generatePrefixedId,
  generateSceneId,
  generateFrameId,
  generateCharId,
  generateCompId,
  generateProjectId,
  generateItemId,
  safeJSONParse,
  computeHash,
  getErrorMessage,
} from './data';

// 字符串工具：截断、大小写、命名风格、校验
export {
  truncateText,
  capitalize,
  camelToKebab,
  kebabToCamel,
  isValidEmail,
  isValidURL,
} from './string';

// 集合工具：数组分块/去重/排序、对象过滤/映射
export { chunkArray, uniqueArray, sortBy } from './collection';

// 颜色/文件工具（color.ts / file.ts）已删除——0 prod 消费者
