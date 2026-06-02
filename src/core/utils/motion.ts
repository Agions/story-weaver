/**
 * frame-forge AI 动效系统
 * 统一的页面过渡和组件动画配置
 *
 * 所有 motion utilities 现在统一在 @/shared/utils 中定义。
 * 本文件提供从 @/core/utils/motion 的导入兼容。
 */

// Re-export all motion utilities from shared utils (single source of truth)
export {
  transitions,
  easings,
  pageVariants,
  fadeInVariants,
  slideUpVariants,
  scaleInVariants,
  listItemVariants,
  cardHoverVariants,
  buttonTapVariants,
  skeletonVariants,
  createPageTransition,
  createStaggerChildren,
} from '@/shared/utils';
