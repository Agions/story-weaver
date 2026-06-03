/**
 * frame-fab Shared Utils - Format UI Utilities
 *
 * Provides UI-specific formatting utilities including status config,
 * relative time formatting, and date formatting.
 */

/**
 * Project status types
 */
export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

/**
 * Status configuration for project display
 */
export interface StatusConfig {
  variant:
    | 'secondary'
    | 'default'
    | 'success'
    | 'destructive'
    | 'outline'
    | 'warning'
    | 'info'
    | 'gold'
    | 'error'
    | 'processing'
    | null
    | undefined;
  text: string;
}

/**
 * Status configuration mapping
 */
export const STATUS_CONFIG: Record<ProjectStatus, StatusConfig> = {
  draft: {
    variant: 'secondary',
    text: '草稿',
  },
  processing: {
    variant: 'default',
    text: '处理中',
  },
  completed: {
    variant: 'success',
    text: '已完成',
  },
  failed: {
    variant: 'destructive',
    text: '失败',
  },
};

/**
 * Get status configuration by status value
 */
export function getStatusConfig(status: ProjectStatus): StatusConfig {
  return STATUS_CONFIG[status] || STATUS_CONFIG.draft;
}

/**
 * Format date for display
 */
export function formatDate(
  date: Date | string | number,
  options?: { format?: 'date' | 'datetime' | 'time' }
): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');

  const fmt = options?.format || 'date';
  if (fmt === 'datetime') return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  if (fmt === 'time') return `${hours}:${minutes}:${seconds}`;
  return `${year}-${month}-${day}`;
}

/**
 * Format date in short format (e.g., "1月1日")
 */
export function formatDateShort(date: Date | string | number): string {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日`;
}

/**
 * Format relative time (e.g., "刚刚", "5分钟前", "2小时前")
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = now - d;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  const d2 = new Date(d);
  const y = d2.getFullYear();
  const m = String(d2.getMonth() + 1).padStart(2, '0');
  const day = String(d2.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
