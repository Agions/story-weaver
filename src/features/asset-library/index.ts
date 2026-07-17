/**
 * Asset Library Feature Slice
 *
 * 资产库垂直切片：核心场景模板 + 资产版本化复用 + 复用率统计。
 * 横向引擎（AI Provider / Pipeline）仍留在 core/。
 *
 * @module features/asset-library
 */

// ========== 类型定义 ==========

/** 场景风格预设 */
export type SceneStyle = 'cinematic' | 'anime' | 'watercolor' | 'realistic' | 'pixel' | 'sketch';

/** 核心场景模板 */
export interface SceneTemplate {
  id: string;
  name: string;
  description: string;
  style: SceneStyle;
  aspectRatio: '16:9' | '9:16' | '1:1';
  defaultPrompt: string;
  negativePrompt: string;
  characters: string[]; // character ids
  tags: string[];
  thumbnailUrl?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** 资产类型 */
export type AssetType = 'image' | 'audio' | 'video' | 'subtitle';

/** 资产记录 */
export interface AssetRecord {
  id: string;
  type: AssetType;
  name: string;
  url: string;
  thumbnailUrl?: string;
  sourceTemplateId?: string;
  sceneId?: string;
  version: number;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** 资产版本历史 */
export interface AssetVersion {
  version: number;
  url: string;
  createdAt: string;
  changeNote?: string;
}

/** 复用统计 */
export interface ReuseStats {
  templateId: string;
  templateName: string;
  totalUsages: number;
  uniqueScenes: number;
  reuseRate: number; // 0-100
  lastUsedAt: string;
}

/** 资产库统计概览 */
export interface AssetLibraryStats {
  totalTemplates: number;
  totalAssets: number;
  totalReuses: number;
  averageReuseRate: number;
  topTemplates: ReuseStats[];
}

/** 创建场景模板输入 */
export interface CreateSceneTemplateInput {
  name: string;
  description: string;
  style: SceneStyle;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  defaultPrompt?: string;
  negativePrompt?: string;
  characters?: string[];
  tags?: string[];
}

/** 注册资产输入 */
export interface RegisterAssetInput {
  type: AssetType;
  name: string;
  url: string;
  thumbnailUrl?: string;
  sourceTemplateId?: string;
  sceneId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

// ========== 常量 ==========

/** 默认核心场景模板数量目标 */
export const TARGET_CORE_SCENES = 12;

/** 高复用率阈值（超过此值视为"高复用"） */
export const HIGH_REUSE_THRESHOLD = 3;

// ========== 服务胶水 ==========

import { v4 as uuidv4 } from 'uuid';

import type { ProjectData } from '@/shared/types';

// ========== 内存存储（生产环境应替换为 IndexedDB / Tauri KV） ==========

interface InMemoryStore {
  templates: Map<string, SceneTemplate>;
  assets: Map<string, AssetRecord>;
  usageLog: Map<string, string[]>; // templateId -> [sceneId, ...]
}

const store: InMemoryStore = {
  templates: new Map(),
  assets: new Map(),
  usageLog: new Map(),
};

// ========== 场景模板管理 ==========

/**
 * 创建核心场景模板
 */
export function createSceneTemplate(input: CreateSceneTemplateInput): SceneTemplate {
  const now = new Date().toISOString();
  const template: SceneTemplate = {
    id: uuidv4(),
    name: input.name,
    description: input.description,
    style: input.style,
    aspectRatio: input.aspectRatio ?? '16:9',
    defaultPrompt: input.defaultPrompt ?? '',
    negativePrompt: input.negativePrompt ?? '',
    characters: input.characters ?? [],
    tags: input.tags ?? [],
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  store.templates.set(template.id, template);
  return template;
}

/**
 * 获取场景模板
 */
export function getSceneTemplate(templateId: string): SceneTemplate | null {
  return store.templates.get(templateId) ?? null;
}

/**
 * 列出所有场景模板
 */
export function listSceneTemplates(filters?: { style?: SceneStyle; tags?: string[] }): SceneTemplate[] {
  let templates = Array.from(store.templates.values());

  if (filters?.style) {
    templates = templates.filter((t) => t.style === filters.style);
  }
  if (filters?.tags && filters.tags.length > 0) {
    const tagSet = new Set(filters.tags);
    templates = templates.filter((t) => t.tags.some((tag) => tagSet.has(tag)));
  }

  return templates.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * 更新场景模板
 */
export function updateSceneTemplate(
  templateId: string,
  updates: Partial<Omit<SceneTemplate, 'id' | 'createdAt'>>
): SceneTemplate | null {
  const existing = store.templates.get(templateId);
  if (!existing) return null;

  const updated: SceneTemplate = {
    ...existing,
    ...updates,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };

  store.templates.set(templateId, updated);
  return updated;
}

/**
 * 删除场景模板
 */
export function deleteSceneTemplate(templateId: string): boolean {
  return store.templates.delete(templateId);
}

// ========== 资产注册与版本管理 ==========

/**
 * 注册资产（关联到模板以实现复用追踪）
 */
export function registerAsset(input: RegisterAssetInput): AssetRecord {
  const now = new Date().toISOString();
  const asset: AssetRecord = {
    id: uuidv4(),
    type: input.type,
    name: input.name,
    url: input.url,
    thumbnailUrl: input.thumbnailUrl,
    sourceTemplateId: input.sourceTemplateId,
    sceneId: input.sceneId,
    version: 1,
    tags: input.tags ?? [],
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  };

  store.assets.set(asset.id, asset);

  // 记录模板使用
  if (input.sourceTemplateId && input.sceneId) {
    recordTemplateUsage(input.sourceTemplateId, input.sceneId);
  }

  return asset;
}

/**
 * 获取资产
 */
export function getAsset(assetId: string): AssetRecord | null {
  return store.assets.get(assetId) ?? null;
}

/**
 * 按模板列出资产
 */
export function listAssetsByTemplate(templateId: string): AssetRecord[] {
  return Array.from(store.assets.values()).filter((a) => a.sourceTemplateId === templateId);
}

/**
 * 按场景列出资产
 */
export function listAssetsByScene(sceneId: string): AssetRecord[] {
  return Array.from(store.assets.values()).filter((a) => a.sceneId === sceneId);
}

/**
 * 记录模板使用（用于复用率统计）
 */
function recordTemplateUsage(templateId: string, sceneId: string): void {
  const usages = store.usageLog.get(templateId) ?? [];
  if (!usages.includes(sceneId)) {
    usages.push(sceneId);
    store.usageLog.set(templateId, usages);
  }
}

// ========== 复用率统计 ==========

/**
 * 计算单个模板的复用率
 */
export function getTemplateReuseRate(templateId: string): ReuseStats | null {
  const template = store.templates.get(templateId);
  if (!template) return null;

  const usages = store.usageLog.get(templateId) ?? [];
  const totalUsages = usages.length;
  const reuseRate = totalUsages >= HIGH_REUSE_THRESHOLD
    ? Math.min(100, Math.round((totalUsages / TARGET_CORE_SCENES) * 100))
    : Math.round((totalUsages / Math.max(1, totalUsages)) * 100);

  return {
    templateId,
    templateName: template.name,
    totalUsages,
    uniqueScenes: new Set(usages).size,
    reuseRate,
    lastUsedAt: usages.length > 0 ? new Date().toISOString() : template.updatedAt,
  };
}

/**
 * 获取资产库统计概览
 */
export function getAssetLibraryStats(): AssetLibraryStats {
  const templates = Array.from(store.templates.values());
  const assets = Array.from(store.assets.values());

  const reuseStats: ReuseStats[] = [];
  let totalReuses = 0;

  for (const template of templates) {
    const stats = getTemplateReuseRate(template.id);
    if (stats) {
      reuseStats.push(stats);
      totalReuses += stats.totalUsages;
    }
  }

  const averageReuseRate = reuseStats.length > 0
    ? Math.round(reuseStats.reduce((sum, s) => sum + s.reuseRate, 0) / reuseStats.length)
    : 0;

  return {
    totalTemplates: templates.length,
    totalAssets: assets.length,
    totalReuses,
    averageReuseRate,
    topTemplates: reuseStats
      .sort((a, b) => b.totalUsages - a.totalUsages)
      .slice(0, 10),
  };
}

/**
 * 获取高复用模板（达到复用率阈值的模板）
 */
export function getHighReuseTemplates(): SceneTemplate[] {
  const highReuseIds = new Set(
    Array.from(store.usageLog.entries())
      .filter(([, usages]) => usages.length >= HIGH_REUSE_THRESHOLD)
      .map(([templateId]) => templateId)
  );

  return Array.from(store.templates.values()).filter((t) => highReuseIds.has(t.id));
}

// ========== 项目集成 ==========

/**
 * 从项目数据中提取未注册的资产并自动注册
 * （在渲染完成后调用，自动追踪资产来源）
 */
export function syncProjectAssets(project: ProjectData): number {
  let registered = 0;

  for (const video of project.videos ?? []) {
    // 检查视频是否已注册
    const existing = Array.from(store.assets.values()).find(
      (a) => a.url === video.path && a.type === 'video'
    );
    if (!existing && video.path) {
      registerAsset({
        type: 'video',
        name: video.name,
        url: video.path,
        sceneId: video.id,
        tags: ['project-asset'],
        metadata: { duration: video.duration, format: video.format },
      });
      registered++;
    }
  }

  return registered;
}

// ========== 导出 ==========

export const assetLibraryService = {
  // 模板
  createSceneTemplate,
  getSceneTemplate,
  listSceneTemplates,
  updateSceneTemplate,
  deleteSceneTemplate,
  // 资产
  registerAsset,
  getAsset,
  listAssetsByTemplate,
  listAssetsByScene,
  // 统计
  getTemplateReuseRate,
  getAssetLibraryStats,
  getHighReuseTemplates,
  // 集成
  syncProjectAssets,
  // 初始化
  initializeCoreTemplates,
};

export default assetLibraryService;

/**
 * 预填充 8-12 个核心场景模板（模块加载时自动执行）
 */
export function initializeCoreTemplates(): void {
  // 如果已有模板则跳过
  if (store.templates.size > 0) return;

  const now = new Date().toISOString();

  const coreTemplates: Omit<SceneTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: '角色特写',
      description: '标准角色近景镜头，用于对话和表情展示',
      style: 'cinematic',
      aspectRatio: '16:9',
      defaultPrompt: 'close-up portrait shot, detailed face, soft lighting, cinematic quality',
      negativePrompt: 'blurry, low quality, distorted face',
      characters: [],
      tags: ['portrait', 'close-up', 'character'],
      version: 1,
    },
    {
      name: '环境全景',
      description: '场景环境全景镜头，建立空间感和氛围',
      style: 'cinematic',
      aspectRatio: '16:9',
      defaultPrompt: 'wide establishing shot, beautiful environment, atmospheric lighting',
      negativePrompt: 'blurry, low quality, distorted',
      characters: [],
      tags: ['environment', 'wide', 'establishing'],
      version: 1,
    },
    {
      name: '对话双人',
      description: '两个角色的对话镜头，用于互动场景',
      style: 'anime',
      aspectRatio: '16:9',
      defaultPrompt: 'two characters talking, medium shot, dialogue scene, anime style',
      negativePrompt: 'blurry, low quality',
      characters: [],
      tags: ['dialogue', 'two-shot', 'conversation'],
      version: 1,
    },
    {
      name: '动作镜头',
      description: '动态动作场景，用于高潮和转折',
      style: 'cinematic',
      aspectRatio: '16:9',
      defaultPrompt: 'dynamic action shot, dramatic lighting, motion blur, cinematic',
      negativePrompt: 'static, boring, low quality',
      characters: [],
      tags: ['action', 'dynamic', 'dramatic'],
      version: 1,
    },
    {
      name: '情绪特写',
      description: '强调角色情绪变化的表情镜头',
      style: 'anime',
      aspectRatio: '9:16',
      defaultPrompt: 'emotional close-up, expressive face, dramatic lighting, anime style',
      negativePrompt: 'neutral, boring, low quality',
      characters: [],
      tags: ['emotion', 'close-up', 'dramatic'],
      version: 1,
    },
    {
      name: '转场过渡',
      description: '场景之间的转场镜头',
      style: 'cinematic',
      aspectRatio: '16:9',
      defaultPrompt: 'smooth transition shot, matching cut, cinematic quality',
      negativePrompt: 'jarring, low quality',
      characters: [],
      tags: ['transition', 'bridge', 'smooth'],
      version: 1,
    },
    {
      name: '回忆闪回',
      description: '过去事件的回忆/闪回镜头',
      style: 'watercolor',
      aspectRatio: '16:9',
      defaultPrompt: 'flashback scene, dreamy atmosphere, soft focus, watercolor style',
      negativePrompt: 'sharp, modern, low quality',
      characters: [],
      tags: ['flashback', 'memory', 'dreamy'],
      version: 1,
    },
    {
      name: '结尾定格',
      description: '故事结尾的定格/总结镜头',
      style: 'cinematic',
      aspectRatio: '16:9',
      defaultPrompt: 'final shot, conclusive scene, cinematic ending, dramatic lighting',
      negativePrompt: 'open ended, low quality',
      characters: [],
      tags: ['ending', 'final', 'conclusive'],
      version: 1,
    },
  ];

  for (const template of coreTemplates) {
    const id = uuidv4();
    store.templates.set(id, {
      ...template,
      id,
      createdAt: now,
      updatedAt: now,
    });
  }
}
