/**
 * 用户偏好默认值
 * ===============
 * 集中默认 UserPreferences，避免在仓库里散落。
 */
import type { UserPreferences } from '@/shared/types';

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  autoSave: true,
  autoSaveInterval: 30,
  defaultVideoQuality: 'high',
  defaultOutputFormat: 'mp4',
  enablePreview: true,
  previewQuality: 'medium',
  notifications: true,
  soundEffects: true,
};
