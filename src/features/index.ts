/**
 * Features Barrel — 垂直切片统一导出
 *
 * 每个 feature 切片自包含页面 + 组件 + 状态 + 服务胶水，
 * 横向引擎（pipeline / ai / media）仍留在 core/。
 *
 * @module features
 */

// 剧本生成
export * from './script-writer';

// 分镜设计
export * from './storyboard';

// 角色一致性锚点 / 角色 DNA
export * from './character-consistency';

// 图片素材库（标准化复用, 8-12 核心场景）
export * from './asset-library';

// 配音 / TTS
export * from './tts-dubbing';

// AI 视频生成 + 后期剪辑 + 发布
export * from './video-export';
