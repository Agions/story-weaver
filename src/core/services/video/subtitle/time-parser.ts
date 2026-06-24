/**
 * 字幕时间解析工具
 *
 * 把 SRT/VTT 的 "HH:MM:SS,mmm" / "MM:SS.mmm" 字符串转成秒，
 * 供 parsers 复用。
 */

/**
 * 解析 HH:MM:SS,mmm / HH:MM:SS.mmm 格式（24h 时分秒 + 毫秒）
 * 无法匹配时返回 0（与原行为一致）。
 * SRT 与 VTT 长格式共用此逻辑 — 提取为内部 helper 消除重复。
 */
function parseTimeHMS(time: string): number {
  const match = time.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!match) {
    return 0;
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const milliseconds = parseInt(match[4], 10);

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

/**
 * 解析 SRT 时间：HH:MM:SS,mmm → 秒
 */
export function parseSRTTime(time: string): number {
  return parseTimeHMS(time);
}

/**
 * 解析 VTT 时间：支持 HH:MM:SS.mmm 与 MM:SS.mmm 短格式。
 * 无法匹配时返回 0。
 */
export function parseVTTTime(time: string): number {
  // 短格式：MM:SS.mmm
  if (!time.includes(':')) {
    const shortMatch = time.match(/(\d{2})[,.](\d{3})/);
    if (shortMatch) {
      return parseInt(shortMatch[1], 10) + parseInt(shortMatch[2], 10) / 1000;
    }
  }

  return parseTimeHMS(time);
}
