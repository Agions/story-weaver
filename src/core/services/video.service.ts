/**
 * 视频处理服务 — 统一入口
 * ========================
 * 实现已迁移到 @/features/video/services/video.service.ts
 * 此文件保留并重新导出，以维持 @core/services/video.service 路径兼容
 */

export {
  videoService,
  type VideoService,
  type VideoInfo,
  type VideoAnalysis,
  type Scene,
  type Keyframe,
  type ExportVideoOptions,
} from '@/features/video/services/video.service';