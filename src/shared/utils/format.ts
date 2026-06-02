/**
 * frame-forge Shared Utils - Formatting Utilities
 */

/**
 * 格式化日期为YYYY-MM-DD格式
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 格式化日期和时间为YYYY-MM-DD HH:MM:SS格式
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export interface FormatTimeOptions {
  /**
   * 小时显示模式:
   *  'never'   = 不显示小时（默认）
   *  'if-nonzero' = 仅在 hours>0 时显示（H:MM:SS，不补0）
   *  'always'  = 始终显示小时（HH:MM:SS，始终补0）
   */
  hours?: 'never' | 'if-nonzero' | 'always';
  /**
   * 毫秒位数: 0=无, 1=十分之一秒, 2=百分之一秒, 3=毫秒
   * 默认 0
   */
  ms?: 0 | 1 | 2 | 3;
  /**
   * 时分秒之间的分隔符，默认 ':'
   * 例如 H:MM:SS / HH:MM:SS
   */
  separator?: string;
  /**
   * 秒与毫秒之间的分隔符（仅 ms>0 时生效），默认 '.'
   * ASS 用 '.'，SRT 用 ','，VTT 用 '.'
   */
  decimalMark?: string;
  /**
   * 数字进位取整方式，默认 Math.floor
   */
  round?: 'floor' | 'round' | 'ceil';
}

/**
 * 统一时间格式化
 * @example formatTime(90)                              → "01:30"
 * @example formatTime(90, { hours: 'always' })         → "00:01:30"
 * @example formatTime(90.5, { ms: 1 })                 → "01:30.5"
 * @example formatTime(3661.5, { hours: 'if-nonzero', ms: 1 }) → "1:01:01.5"
 */
export function formatTime(seconds: number, opts: FormatTimeOptions = {}): string {
  const { hours = 'never', ms = 0, separator = ':', decimalMark = '.', round = 'floor' } = opts;
  if (isNaN(seconds) || seconds < 0) return `00:00${ms > 0 ? decimalMark + '0'.repeat(ms) : ''}`;

  const roundFn = round === 'ceil' ? Math.ceil : round === 'round' ? Math.round : Math.floor;

  let totalSecs = Math.floor(seconds);
  let fractional = 0;

  if (ms > 0) {
    const base = ms === 3 ? 1000 : ms === 2 ? 100 : 10;
    const secFrac = (seconds - totalSecs) * base;
    const roundedFrac = roundFn(secFrac);
    const carry = roundedFrac >= base ? 1 : 0;
    fractional = roundedFrac % base;
    // 只有当 ms>0 时，round 才影响总秒（通过进位），不影响分解方式
    if (carry > 0) totalSecs += carry;
  } else {
    // ms=0 时，round 决定总秒如何分解
    totalSecs = roundFn(seconds);
  }

  const s = totalSecs % 60;
  const totalMins = Math.floor(totalSecs / 60);
  const h = Math.floor(totalMins / 60);

  const pad = (n: number, len = 2) => String(n).padStart(len, '0');

  let m: number;
  let hourStr = '';
  if (hours === 'always') {
    m = totalMins % 60;
    hourStr = `${pad(h)}${separator}`;
  } else if (hours === 'if-nonzero') {
    m = totalMins % 60; // 保持分钟在 0-59 范围
    hourStr = h > 0 ? `${h}${separator}` : '';
  } else {
    // 'never'
    m = totalMins;
  }

  const fracStr =
    ms > 0
      ? `${decimalMark}${ms === 1 ? String(fractional) : pad(ms === 3 ? fractional : fractional, ms === 2 ? 2 : 3)}`
      : '';

  return `${hourStr}${pad(m)}${separator}${pad(s)}${fracStr}`;
}

/**
 * 将秒数格式化为hh:mm:ss的时间格式
 */
/**
 * Format duration in hh:mm:ss (hours omitted if 0)
 */
export const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const hoursStr = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
  return `${hoursStr}${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format duration in mm:ss (short format, hours always omitted)
 */
export const formatDurationShort = (seconds?: number): string => {
  if (seconds == null || isNaN(seconds) || seconds < 0) return '未知';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString()}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 将字节大小格式化为人类可读格式
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化MB值为友好的文件大小显示
 * @param mb 文件大小（MB）
 */
export const formatSizeMB = (mb: number): string => {
  if (mb < 0.001) return '< 1 KB';
  if (mb < 1) return `${Math.round(mb * 1000)} KB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
};

/**
 * 格式化时长为友好显示（例如：2小时30分钟）
 */
export const formatFriendlyDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0秒';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  let result = '';
  if (hours > 0) result += `${hours}小时`;
  if (minutes > 0 || hours > 0) result += `${minutes}分钟`;
  if (secs > 0 && hours === 0) result += `${secs}秒`;
  return result || '0秒';
};

/**
 * 格式化数字，添加千分位分隔符
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

/**
 * 转换为百分比格式
 */
export const formatPercent = (value: number, decimals: number = 0): string => {
  if (isNaN(value)) return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
};
