/**
 * 专业加载组件
 */

import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import styles from './Loading.module.less';

interface LoadingProps {
  tip?: string;
  size?: 'small' | 'default' | 'large';
  fullscreen?: boolean;
  children?: React.ReactNode;
}

const Loading: React.FC<LoadingProps> = ({ 
  tip = '加载中...', 
  size = 'default',
  fullscreen = false,
  children 
}) => {
  const spinIcon = <LoadingOutlined spin style={{ fontSize: size === 'large' ? 48 : size === 'small' ? 16 : 24 }} />;

  if (fullscreen) {
    return (
      <div className={styles.fullscreen}>
        <Spin indicator={spinIcon} tip={tip} size={size} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Spin indicator={spinIcon} tip={tip} size={size}>
        {children}
      </Spin>
    </div>
  );
};

// 骨架屏加载
interface SkeletonProps {
  active?: boolean;
  avatar?: boolean;
  title?: boolean;
  paragraph?: boolean | { rows?: number };
}

export const PageSkeleton: React.FC<SkeletonProps> = () => (
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
