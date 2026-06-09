/**
 * 场景级 FFmpeg filter_complex 构造器
 *
 * 把"按场景缩放/淡入淡出"这种字符串拼装从 composeVideoWithFFmpeg 中剥离。
 * 纯函数，可独立测试。
 */

import type { Scene, SceneEffect } from './types';

interface SceneResolution {
  width: number;
  height: number;
}

/**
 * 单场景缩放 + pad filter：保持比例，剩余区域填充黑边。
 */
function buildScalePadFilter(index: number, resolution: SceneResolution): string {
  const { width, height } = resolution;
  return `[${index}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
}

/**
 * 把场景的淡入淡出效果转成 filter 片段。
 * 不支持的效果类型返回空串。
 */
function buildFadeFilters(effects: SceneEffect[] | undefined): string {
  if (!effects || effects.length === 0) {
    return '';
  }
  const parts: string[] = [];
  for (const effect of effects) {
    if (effect.type === 'fade_in') {
      parts.push(`fade=t=in:d=${effect.duration}`);
    } else if (effect.type === 'fade_out') {
      parts.push(`fade=t=out:d=${effect.duration}`);
    }
    // zoom/slide/blur 当前不展开，保持与原行为一致
  }
  return parts.length > 0 ? `,${parts.join(',')}` : '';
}

/**
 * 全图片场景：构造 filter_complex。
 *
 * 每个场景 → [vN]，最后拼接为 [outv]。
 */
export function buildImageOnlyFilterComplex(scenes: Scene[], resolution: SceneResolution): string {
  const perSceneFilters: string[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const scalePad = buildScalePadFilter(i, resolution);
    const fadeFilters = buildFadeFilters(scene.effects);
    perSceneFilters.push(`${scalePad}${fadeFilters}[v${i}]`);
  }

  const concatInputs = scenes.map((_, i) => `[v${i}]`).join('');
  const concatFilter = `${concatInputs}concat=n=${scenes.length}:v=1:a=0[outv]`;

  return [...perSceneFilters, concatFilter].join(';');
}

/**
 * 混合图片/视频场景：构造 filter_complex。
 *
 * 每个场景独立缩放后用 concat 拼接。
 */
export function buildMixedMediaFilterComplex(
  sceneCount: number,
  resolution: SceneResolution,
  totalDurationSeconds: number
): string {
  const perSceneFilters: string[] = [];

  for (let i = 0; i < sceneCount; i++) {
    perSceneFilters.push(
      `[${i}:v]scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS+${totalDurationSeconds}s/TB[v${i}]`
    );
  }

  const concatInputs =
    sceneCount > 0 ? Array.from({ length: sceneCount }, (_, i) => `[v${i}]`).join('') : '';
  const concatFilter = `${concatInputs}concat=n=${sceneCount}:v=1:a=0[outv]`;

  return [...perSceneFilters, concatFilter].join(';');
}
