/**
 * 渲染失败时的占位图构造
 * @module core/services/project/render-queue-fallback
 *
 * 提取自原 RenderQueueService.buildFallbackImage + 内部 sanitizeForSvg。
 * SVG 内嵌 + URL 编码生成 data URI。
 */

import { FALLBACK_IMAGE_FONT_SIZE, FALLBACK_IMAGE_SIZE } from './render-queue-types';

/**
 * 把字符串转义为 SVG 安全内容
 *
 * 行为与原 `sanitizeForSvg` 字节级一致：
 *   & → &amp;  < → &lt;  > → &gt;  " → &quot;  ' → &apos;
 */
export function sanitizeForSvg(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 构造占位 SVG data URI（与原 buildFallbackImage 字节级一致） */
export function buildFallbackImage(title: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${FALLBACK_IMAGE_SIZE}' height='${FALLBACK_IMAGE_SIZE}'>
      <defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
      <stop stop-color='#0ea5e9' offset='0'/><stop stop-color='#2563eb' offset='1'/></linearGradient></defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='${FALLBACK_IMAGE_FONT_SIZE}' font-family='sans-serif'>${sanitizeForSvg(title)}</text>
    </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
