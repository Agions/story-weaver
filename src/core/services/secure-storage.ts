/**
 * SecureStorageService - 安全存储服务
 * 使用 Tauri Store API 替代 localStorage，敏感数据加密存储
 * 
 * 在非 Tauri 环境（如测试）中回退到 localStorage
 */

import { secureStorage } from './secure-storage.service';

// Re-export for backwards compatibility
export const secureStorageService = secureStorage;
export default secureStorage;
