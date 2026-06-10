/**
 * 时长格式化 (mm:ss / hh:mm:ss)
 * ==============================
 * 把秒数转成可读时间字符串。
 * 单一职责：纯函数格式化。
 */

/**
 * 秒 → "m:ss" 或 "h:mm:ss"
 * 不到 1 小时只显示 m:ss，超过则显示 h:mm:ss。
 */
export function formatVideoDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
