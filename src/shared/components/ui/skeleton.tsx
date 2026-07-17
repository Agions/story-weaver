/**
 * 骨架屏组件
 * 用于加载过程中的占位显示，提升用户体验
 */

import React from 'react';

// Local Skeleton wrapper with antd-style variant support
function Skeleton({
  variant,
  width,
  height,
  className,
  style,
  ...props
}: {
  variant?: 'text' | 'circular' | 'default';
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLDivElement>) {
  const variantClass = variant === 'circular' ? 'rounded-full' : variant === 'text' ? '' : '';
  const defaultHeight = variant === 'text' ? '1em' : undefined;
  return (
    <SkeletonComponent
      className={[variantClass, className].filter(Boolean).join(' ') || undefined}
      style={{ width, height: height ?? defaultHeight, ...style }}
      {...props}
    />
  );
}

// ============================================

export interface BasicSkeletonProps {
  active?: boolean;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const BasicSkeleton = ({ width, height, className }: BasicSkeletonProps) => {
  return <Skeleton className={className} style={{ width, height }} />;
};

// ============================================
// 卡片骨架屏
// ============================================

/** 4 个骨架屏 interface 共享的 6 字段基类型。 */
export interface BaseSkeletonProps {
  active?: boolean;
  [key: string]: unknown;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export type CardSkeletonProps = BaseSkeletonProps & {
  title?: boolean | string;
  avatar?: boolean;
  cover?: boolean;
  actions?: boolean;
};

export const CardSkeleton = ({ title = true, avatar = true, className }: CardSkeletonProps) => {
  return (
    <div className={className}>
      <div className="space-y-4">
        {avatar && <Skeleton variant="circular" width={40} height={40} />}
        {title && <Skeleton variant="text" width="60%" />}
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  );
};

// ============================================
// 列表骨架屏
// ============================================

export type ListSkeletonProps = BaseSkeletonProps & {
  count?: number;
  avatar?: boolean;
  cover?: boolean;
  actions?: boolean;
};

export const ListSkeleton = ({ count = 3, avatar = true, className }: ListSkeletonProps) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 py-2">
          {avatar && <Skeleton variant="circular" width={40} height={40} />}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
};
// ============================================

export type FormSkeletonProps = BaseSkeletonProps & {
  count?: number;
  labels?: boolean;
  button?: boolean;
};

export const FormSkeleton = ({
  count = 4,
  labels = true,
  button = true,
  className,
}: FormSkeletonProps) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2 mb-4">
          {labels && <Skeleton variant="text" width={80} />}
          <Skeleton variant="text" width="100%" height={40} />
        </div>
      ))}
      {button && (
        <div className="mt-4">
          <Skeleton variant="text" width={80} height={40} />
        </div>
      )}
    </div>
  );
};

// ============================================
// 统计卡片骨架屏
// ============================================

export type StatisticSkeletonProps = BaseSkeletonProps & {
  count?: number;
  icon?: boolean;
  title?: boolean | string;
  value?: boolean;
};

export const StatisticSkeleton = ({
  count = 4,
  icon = true,
  title = true,
  value = true,
  className,
}: StatisticSkeletonProps) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          {icon && <Skeleton variant="circular" width={32} height={32} />}
          <div className="flex-1">
            {title && <Skeleton variant="text" width={60} height={16} />}
            {value && <Skeleton variant="text" width={100} height={28} />}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================
// 统一骨架屏
// ============================================

export type SkeletonType = 'basic' | 'card' | 'list' | 'form' | 'statistic';

export interface UnifiedSkeletonProps {
  type?: SkeletonType;
  active?: boolean;
  title?: boolean | string;
  avatar?: boolean;
  cover?: boolean;
  actions?: boolean;
  count?: number;
  labels?: boolean;
  button?: boolean;
  icon?: boolean;
  value?: boolean;
  children?: React.ReactNode;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export const SkeletonComponent = ({
  type = 'basic',
  active = true,
  className,
  ...props
}: UnifiedSkeletonProps) => {
  switch (type) {
    case 'card':
      return <CardSkeleton {...props} active={active} className={className} />;
    case 'list':
      return <ListSkeleton {...props} active={active} className={className} />;
    case 'form':
      return <FormSkeleton {...props} active={active} className={className} />;
    case 'statistic':
      return <StatisticSkeleton {...props} active={active} className={className} />;
    default:
      return <BasicSkeleton active={active} className={className} />;
  }
};

export default SkeletonComponent;
