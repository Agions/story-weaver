/**
 * Zod Validation Schemas - 类型安全验证
 * 全面覆盖 API 响应和数据模型的 schema 验证
 */

import { z } from 'zod';

// ============ Pipeline Types ============

export const PipelineStepIdSchema = z.enum([
  'import',
  'analysis',
  'script',
  'audio',
  'character',
  'storyboard',
  'render',
  'video-editing',
  'composition',
]);

export const PipelineStatusSchema = z.enum([
  'idle',
  'running',
  'paused',
  'completed',
  'cancelled',
  'failed',
]);

// ============ Script Types ============

export const ScriptSegmentSchema = z.object({
  id: z.string(),
  speaker: z.string().optional(),
  content: z.string(),
  duration: z.number().optional(),
  emotion: z.string().optional(),
  voiceConfig: z
    .object({
      voiceId: z.string(),
      speed: z.number().optional(),
      pitch: z.number().optional(),
    })
    .optional(),
});

export const ScriptDataSchema = z.object({
  title: z.string(),
  scenes: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      segments: z.array(ScriptSegmentSchema),
      background: z.string().optional(),
      duration: z.number(),
    })
  ),
  totalDuration: z.number(),
});

// ============ Character Types ============

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  avatar: z.string().optional(),
  expressions: z.record(z.string(), z.string()).optional(),
  appearances: z.array(z.string()).optional(),
});

export const CharacterOutputSchema = z.object({
  characters: z.array(CharacterSchema),
  characterCount: z.number(),
  primaryCharacters: z.array(z.string()),
});

// ============ Storyboard Types ============

export const KeyframeSchema = z.object({
  id: z.string(),
  sceneId: z.string(),
  imageUrl: z.string(),
  thumbnailUrl: z.string().optional(),
  description: z.string(),
  cameraAngle: z.enum(['wide', 'medium', 'close-up', 'pan', 'tilt', 'dolly', 'fixed']).optional(),
  transition: z.enum(['cut', 'fade', 'dissolve', 'wipe', 'slide']).optional(),
  duration: z.number(),
});

export const StoryboardOutputSchema = z.object({
  keyframes: z.array(KeyframeSchema),
  sceneCount: z.number(),
  totalDuration: z.number(),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:3']),
});

// ============ Video Types ============

export const VideoSegmentSchema = z.object({
  id: z.string(),
  start: z.number(),
  end: z.number(),
  type: z.enum(['scene', 'transition', 'subtitle']).optional(),
  content: z.string().optional(),
});

export const RenderOutputSchema = z.object({
  videoUrl: z.string(),
  thumbnailUrl: z.string().optional(),
  duration: z.number(),
  format: z.enum(['mp4', 'webm', 'mov']),
  quality: z.enum(['low', 'medium', 'high', 'ultra']),
  fileSize: z.number().optional(),
});

export const VideoEditingOutputSchema = z.object({
  segments: z.array(VideoSegmentSchema),
  transitions: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      type: z.string(),
      duration: z.number(),
    })
  ),
  subtitles: z
    .array(
      z.object({
        start: z.number(),
        end: z.number(),
        text: z.string(),
      })
    )
    .optional(),
  music: z
    .object({
      url: z.string(),
      volume: z.number(),
    })
    .optional(),
});

// ============ Audio Types ============

export const AudioSynthesisOutputSchema = z.object({
  voiceovers: z.array(
    z.object({
      segmentId: z.string(),
      audioUrl: z.string(),
      duration: z.number(),
    })
  ),
  backgroundMusic: z
    .object({
      url: z.string(),
      duration: z.number(),
      fadeIn: z.number().optional(),
      fadeOut: z.number().optional(),
    })
    .optional(),
  totalDuration: z.number(),
});

// ============ API Response Types ============

export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
});

export const PaginatedResponseSchema = z.object({
  items: z.array(z.unknown()),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  hasMore: z.boolean(),
});

// ============ Project Types ============

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  status: z.enum(['draft', 'processing', 'completed', 'failed']),
  thumbnail: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const ProjectListResponseSchema = z.object({
  projects: z.array(ProjectSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

// ============ Settings Types ============

export const UserSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['zh-CN', 'en-US']),
  autoSave: z.boolean(),
  autoSaveInterval: z.number().min(10000).max(300000),
  defaultVideoQuality: z.enum(['low', 'medium', 'high', 'ultra']),
  defaultAspectRatio: z.enum(['16:9', '9:16', '1:1', '4:3']),
  notificationEnabled: z.boolean(),
  shortcutEnabled: z.boolean(),
});

// ============ AI Model Types ============

export const AIModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.enum(['openai', 'anthropic', 'google', 'deepseek', 'zhipu', 'minimax', 'custom']),
  type: z.enum(['chat', 'image', 'audio', 'video']),
  enabled: z.boolean(),
  apiKeyConfigured: z.boolean(),
  settings: z
    .object({
      temperature: z.number().min(0).max(2),
      maxTokens: z.number().min(100).max(128000),
      topP: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

// ============ Validation Helper Functions ============

export function validateSchema<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validatePipelineStepId(id: string): boolean {
  return PipelineStepIdSchema.safeParse(id).success;
}

export function validateProject(data: unknown): { success: true; data: z.infer<typeof ProjectSchema> } | { success: false; error: z.ZodError } {
  return validateSchema(ProjectSchema, data);
}

export function validateScriptData(data: unknown): { success: true; data: z.infer<typeof ScriptDataSchema> } | { success: false; error: z.ZodError } {
  return validateSchema(ScriptDataSchema, data);
}

export function validateRenderOutput(data: unknown): { success: true; data: z.infer<typeof RenderOutputSchema> } | { success: false; error: z.ZodError } {
  return validateSchema(RenderOutputSchema, data);
}

export function validateSettings(data: unknown): { success: true; data: z.infer<typeof UserSettingsSchema> } | { success: false; error: z.ZodError } {
  return validateSchema(UserSettingsSchema, data);
}
