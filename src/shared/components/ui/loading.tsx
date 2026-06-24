/**
 * 专业加载组件
 */

import { Loader2 } from 'lucide-react';
import React from 'react';

interface LoadingProps {
  tip?: string;
  size?: 'small' | 'default' | 'large';
  fullscreen?: boolean;
  children?: React.ReactNode;
}

const Loading = ({
  tip = '加载中...',
  size = 'default',
  fullscreen = false,
  children,
}: LoadingProps) => {
  const iconSize = size === 'large' ? 48 : size === 'small' ? 16 : 24;

  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin" style={{ width: iconSize, height: iconSize }} />
          {tip && <p className="text-muted-foreground">{tip}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="animate-spin" style={{ width: iconSize, height: iconSize }} />
        {tip && <p className="text-muted-foreground text-sm">{tip}</p>}
        {children}
      </div>
    </div>
  );
};

// 骨架屏加载
export const PageSkeleton = (): JSX.Element => (
  <div className="space-y-4 animate-pulse">
    <div className="h-4 w-32 bg-muted rounded" />
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded" />
      <div className="h-4 bg-muted rounded w-4/5" />
      <div className="h-4 bg-muted rounded w-3/5" />
    </div>
  </div>
);

export default Loading;
