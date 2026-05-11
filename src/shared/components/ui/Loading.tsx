/**
 * 专业加载组件
 */

import { Loader2 } from 'lucide-react';
import React from 'react';

import styles from './Loading.module.less';

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
      <div className={styles.fullscreen}>
        <Loader2 className="animate-spin" style={{ width: iconSize, height: iconSize }} />
        {tip && <p className="mt-4 text-muted-foreground">{tip}</p>}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="animate-spin" style={{ width: iconSize, height: iconSize }} />
        {tip && <p className="text-muted-foreground text-sm">{tip}</p>}
        {children}
      </div>
    </div>
  );
};

// 骨架屏加载
interface PageSkeletonProps {
  active?: boolean;
  avatar?: boolean;
  title?: boolean;
  paragraph?: boolean | { rows?: number };
}

export const PageSkeleton = (): JSX.Element => (
  <div className={styles.skeleton}>
    <div className={styles.skeletonHeader} />
    <div className={styles.skeletonContent}>
      <div className={styles.skeletonParagraph} />
      <div className={styles.skeletonParagraph} style={{ width: '80%' }} />
      <div className={styles.skeletonParagraph} style={{ width: '60%' }} />
    </div>
  </div>
);

export default Loading;
