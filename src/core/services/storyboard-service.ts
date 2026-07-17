/**
 * 分镜服务 - Storyboard Service（facade）
 *
 * 历史背景：本文件原为 487 行单类，承担 CRUD / AI 生成 / 持久化 / 订阅 / 导入导出
 * 五类职责。第 15 轮重构拆为 6 个子模块（types / frame-factory / prompt-builder /
 * scene-splitter / persistence / subscriber），本 facade 保留所有对外公开 API 签名
 * 以保证调用方零改动。
 *
 * 拆分思路：
 * 1. 字段默认值集中在 frame-factory（消除 create / bulkCreate / generateFromScript 3 处重复）
 * 2. 提示词模板集中在 prompt-builder（便于调优）
 * 3. 持久化为纯函数 persistence（不再耦合类成员）
 * 4. 订阅封装为 subscriber 工厂
 * 5. 类主流程只剩"编排"——读 / 写 / 通知三件事
 */

import { logger } from '@/core/utils/logger';

import {
  imageGenerationService,
  type ImageGenerationOptions,
} from './ai/image/image-generation-service';
import { aiService } from './ai/text/ai-service';
import { coerceAiFrame, createStoryboardFrame } from './storyboard-frame-factory';
import { loadStoryboardsFromStorage, saveStoryboardsToStorage } from './storyboard-persistence';
import {
  buildGenerateFromScriptPrompt,
  buildStoryboardImagePrompt,
} from './storyboard-prompt-builder';
import { generateFallbackFrames } from './storyboard-scene-splitter';
import { createStoryboardSubscriber } from './storyboard-subscriber';
import {
  resolveProjectKey,
  type GenerateStoryboardOptions,
  type ScriptInput,
  type StoryboardFrame,
  type StoryboardServiceOptions,
} from './storyboard-types';

// 重导出公共类型，保持 `@/core/services/storyboard-service` 一站式导入
export type { StoryboardFrame, StoryboardServiceOptions };

/**
 * 分镜服务
 *
 * 内部维护：
 *   - storyboards: projectId -> frames 映射
 *   - subscriber: 订阅器实例
 */
export class StoryboardService {
  private storyboards: Map<string, StoryboardFrame[]> = new Map();
  private projectId?: string;
  private autoSave: boolean;
  private subscriber = createStoryboardSubscriber();

  constructor(options: StoryboardServiceOptions = {}) {
    this.projectId = options.projectId;
    this.autoSave = options.autoSave ?? true;

    // 启动时从 localStorage 加载
    const loaded = loadStoryboardsFromStorage(this.projectId);
    if (loaded.length > 0) {
      this.storyboards.set(resolveProjectKey(this.projectId), loaded);
    }
  }

  // ========== 基础 CRUD ==========

  /** 获取当前项目的所有分镜 */
  getAll(): StoryboardFrame[] {
    return this.storyboards.get(resolveProjectKey(this.projectId)) ?? [];
  }

  /** 根据 ID 查找分镜 */
  getById(id: string): StoryboardFrame | undefined {
    return this.getAll().find((f) => f.id === id);
  }

  /** 创建单帧分镜 */
  create(
    frameData: Partial<StoryboardFrame> & { title: string; sceneDescription: string }
  ): StoryboardFrame {
    const frame = createStoryboardFrame(frameData);
    this.appendFrames([frame]);
    return frame;
  }

  /** 更新分镜字段；返回更新后的帧，未找到时返回 null */
  update(id: string, updates: Partial<StoryboardFrame>): StoryboardFrame | null {
    const key = resolveProjectKey(this.projectId);
    const frames = this.storyboards.get(key) ?? [];
    const index = frames.findIndex((f) => f.id === id);
    if (index === -1) return null;

    frames[index] = { ...frames[index], ...updates };
    this.storyboards.set(key, frames);
    this.commit();
    return frames[index];
  }

  /** 删除分镜；返回是否实际删除 */
  delete(id: string): boolean {
    const key = resolveProjectKey(this.projectId);
    const frames = this.storyboards.get(key) ?? [];
    const index = frames.findIndex((f) => f.id === id);
    if (index === -1) return false;

    frames.splice(index, 1);
    this.storyboards.set(key, frames);
    this.commit();
    return true;
  }

  /** 批量创建 */
  bulkCreate(
    frameDataList: Array<Partial<StoryboardFrame> & { title: string; sceneDescription: string }>
  ): StoryboardFrame[] {
    const newFrames = frameDataList.map((data) => createStoryboardFrame(data));
    this.appendFrames(newFrames);
    return newFrames;
  }

  /** 清空当前项目分镜 */
  clear(): void {
    const key = resolveProjectKey(this.projectId);
    this.storyboards.set(key, []);
    this.commit();
  }

  // ========== AI 生成 ==========

  /** 从剧本生成完整分镜（AI 失败时回退到 splitContentIntoScenes） */
  async generateFromScript(
    script: ScriptInput,
    options: GenerateStoryboardOptions = {}
  ): Promise<StoryboardFrame[]> {
    const { provider = 'alibaba', model = 'qwen-3.5', frameCount = 8 } = options;

    try {
      const result = await aiService.generate(buildGenerateFromScriptPrompt(script, frameCount), {
        provider,
        model,
      });

      // 尝试从 AI 返回值中提取 JSON 数组
      let parsed: Partial<StoryboardFrame>[] = [];
      try {
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch {
        logger.warn('Failed to parse AI response as JSON, using fallback');
      }

      // 解析失败或返回空 → 用规则化兜底
      const source = parsed.length > 0 ? parsed : generateFallbackFrames(script, frameCount);
      const frames = source.map((f, i) => coerceAiFrame(f, i));

      // 覆盖当前项目
      this.storyboards.set(resolveProjectKey(this.projectId), frames);
      this.commit();
      return frames;
    } catch (error) {
      logger.error('Failed to generate storyboard from script:', error);
      throw error;
    }
  }

  /** 生成分镜图像（结果会写回 imageUrl） */
  async generateFrameImage(
    frameId: string,
    options: ImageGenerationOptions = {}
  ): Promise<string | null> {
    const frame = this.getById(frameId);
    if (!frame) return null;

    try {
      const result = await imageGenerationService.generateImage(buildStoryboardImagePrompt(frame), {
        ...options,
        model: options.model ?? 'seedream-5.0',
      });
      if (result.url) {
        this.update(frameId, { imageUrl: result.url });
      }
      return result.url ?? null;
    } catch (error) {
      logger.error('Failed to generate frame image:', error);
      return null;
    }
  }

  /** 批量生成分镜图像；带可选进度回调 */
  async generateAllFrameImages(
    options: ImageGenerationOptions = {},
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, string>> {
    const frames = this.getAll();
    const results = new Map<string, string>();

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      onProgress?.(i + 1, frames.length);

      // 已有 imageUrl 的帧直接复用
      if (frame.imageUrl) {
        results.set(frame.id, frame.imageUrl);
        continue;
      }

      const imageUrl = await this.generateFrameImage(frame.id, options);
      if (imageUrl) {
        results.set(frame.id, imageUrl);
      }
    }
    return results;
  }

  // ========== 订阅 ==========

  /** 订阅分镜变更，返回取消函数 */
  subscribe = this.subscriber.subscribe;

  // ========== 导入导出 ==========

  /** 导出当前项目分镜为 JSON 字符串 */
  export(): string {
    return JSON.stringify(this.getAll(), null, 2);
  }

  /** 从 JSON 字符串导入分镜；返回实际写入的有效帧 */
  import(jsonData: string): StoryboardFrame[] {
    try {
      const imported = JSON.parse(jsonData) as StoryboardFrame[];
      const validFrames = imported.filter((f) => f.id && f.title && f.sceneDescription);
      this.storyboards.set(resolveProjectKey(this.projectId), validFrames);
      this.commit();
      return validFrames;
    } catch (error) {
      logger.error('Failed to import storyboards:', error);
      return [];
    }
  }

  // ========== 内部辅助 ==========

  /** 把若干帧追加到当前项目（用于 create / bulkCreate） */
  private appendFrames(newFrames: StoryboardFrame[]): void {
    const key = resolveProjectKey(this.projectId);
    const existing = this.storyboards.get(key) ?? [];
    this.storyboards.set(key, [...existing, ...newFrames]);
    this.commit();
  }

  /** 统一"通知订阅者 + 持久化"出口（替代原散落的 notify+save 重复） */
  private commit(): void {
    this.subscriber.notify(this.getAll());
    saveStoryboardsToStorage(this.projectId, this.getAll(), this.autoSave);
  }
}

// ========== 单例 ==========

let storyboardServiceInstance: StoryboardService | null = null;

export function getStoryboardService(options?: StoryboardServiceOptions): StoryboardService {
  if (!storyboardServiceInstance) {
    storyboardServiceInstance = new StoryboardService(options);
  }
  return storyboardServiceInstance;
}

export function resetStoryboardService(): void {
  storyboardServiceInstance = null;
}
