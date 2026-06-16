/**
 * 共享 UI 组件导出
 * 包装 shadcn/ui 基础组件和自定义业务组件
 */

export { Button as SharedButton } from './button';
export { Card as SharedCard } from './card';
export * from './confirm-dialog';
export * from './empty';
export { default as Loading, PageSkeleton as LoadingSpinner } from './loading';
export { default as Skeleton, SkeletonComponent } from './skeleton';
export * from './toast';
export { EmptyState } from './empty';
