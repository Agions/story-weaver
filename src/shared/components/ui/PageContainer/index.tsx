/**
 * 页面容器组件
 * 统一页面布局结构，提供标准化的页面框架
 */

import React from 'react';
import { Card } from '@/shared/components/ui/Card';

import styles from './PageContainer.module.less';

// ============================================
// 类型定义
// ============================================

export interface PageContainerProps {
  /** 页面标题 */
  title?: React.ReactNode;
  /** 页面描述 */
  description?: string;
  /** 页面操作区 */
  extra?: React.ReactNode;
  /** 页面内容 */
  children?: React.ReactNode;
  /** 是否显示背景卡片 */
  showCard?: boolean;
  /** 是否显示动画 */
  animated?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 页面底部 */
  footer?: React.ReactNode;
  /** 紧凑模式 */
  compact?: boolean;
  /** 两侧边距 */
  padding?: number | 'none';
}

export interface PageSectionProps {
  /** 区块标题 */
  title?: React.ReactNode;
  /** 区块描述 */
  description?: string;
  /** 区块操作 */
  extra?: React.ReactNode;
  /** 区块内容 */
  children: React.ReactNode;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否使用卡片样式 */
  card?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 底部内容 */
  footer?: React.ReactNode;
}

export interface StatisticCardProps {
  /** 标题 */
  title?: React.ReactNode;
  /** 数值 */
  value?: React.ReactNode;
  /** 图标 */
  icon?: React.ReactNode;
  /** 趋势（up/down） */
  trend?: 'up' | 'down' | 'none';
  /** 趋势值 */
  trendValue?: string;
  /** 颜色主题 */
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  /** 是否加载中 */
  loading?: boolean;
  /** 点击事件 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
}

export interface ActionCardProps {
  /** 标题 */
  title?: React.ReactNode;
  /** 描述 */
  description?: React.ReactNode;
  /** 图标 */
  icon?: React.ReactNode;
  /** 操作按钮 */
  actions?: React.ReactNode;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 点击事件 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 底部内容 */
  footer?: React.ReactNode;
}

// ============================================
// 页面容器组件
// ============================================

/**
 * 页面容器组件
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  description,
  extra,
  children,
  showCard = false,
  animated = true,
  className,
  footer,
  compact = false,
  padding,
}) => {
  const containerStyle: React.CSSProperties = {};
  if (padding !== undefined && padding !== 'none') {
    containerStyle.padding = typeof padding === 'number' ? `${padding}px` : padding;
  }

  const content = (
    <>
      {(title || description || extra) && (
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {title && (
              typeof title === 'string' ? (
                <h3 className={styles.title}>{title}</h3>
              ) : (
                <div className={styles.title}>{title}</div>
              )
            )}
            {description && (
              <p className={styles.description}>
                {description}
              </p>
            )}
          </div>
          {extra && <div className={styles.extra}>{extra}</div>}
        </div>
      )}
      <div className={styles.content} style={containerStyle}>
        {children}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </>
  );

  if (showCard) {
    return (
      <Card
        className={`${styles.container} ${compact ? styles.compact : ''} ${className || ''}`}
        borderless
      >
        {animated ? <div className={styles.animated}>{content}</div> : content}
      </Card>
    );
  }

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''} ${className || ''}`}>
      {animated ? <div className={styles.animated}>{content}</div> : content}
    </div>
  );
};

// ============================================
// 页面区块组件
// ============================================

/**
 * 页面区块组件
 */
export const PageSection: React.FC<PageSectionProps> = ({
  title,
  description,
  extra,
  children,
  bordered = true,
  card = false,
  className,
  footer,
}) => {
  if (card) {
    return (
      <Card
        className={`${styles.section} ${bordered ? '' : styles.noBorder} ${className || ''}`}
        title={title && (
          <div className={styles.sectionHeader}>
            <span>{title}</span>
            {extra && <span className={styles.sectionExtra}>{extra}</span>}
          </div>
        )}
        extra={!title && extra ? extra : undefined}
      >
        {description && (
          <p className={styles.sectionDesc}>
            {description}
          </p>
        )}
        {children}
        {footer && <div className={styles.sectionFooter}>{footer}</div>}
      </Card>
    );
  }

  return (
    <div className={`${styles.sectionPlain} ${bordered ? styles.bordered : ''} ${className || ''}`}>
      {(title || extra) && (
        <div className={styles.sectionHeader}>
          {title && <span style={{ fontWeight: 600 }}>{title}</span>}
          {extra && <span className={styles.sectionExtra}>{extra}</span>}
        </div>
      )}
      {description && (
        <p className={styles.sectionDesc}>
          {description}
        </p>
      )}
      {children}
      {footer && <div className={styles.sectionFooter}>{footer}</div>}
    </div>
  );
};

// ============================================
// 统计卡片组件
// ============================================

/**
 * 统计卡片组件
 */
export const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  icon,
  trend = 'none',
  trendValue,
  color = 'primary',
  loading = false,
  onClick,
  className,
}) => {
  const colorMap = {
    primary: '#1E88E5',
    success: '#26A69A',
    warning: '#FF9800',
    error: '#FF5252',
    info: '#42A5F5',
  };

  if (loading) {
    return (
      <Card className={`${styles.statCard} ${className || ''}`}>
        <div className={styles.statContent}>
          <div className={styles.skeletonBlock} style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <div className={styles.statInfo}>
            <div className={styles.skeletonBlock} style={{ width: 60, height: 14 }} />
            <div className={styles.skeletonBlock} style={{ width: 80, height: 28, marginTop: 8 }} />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`${styles.statCard} ${onClick ? styles.clickable : ''} ${className || ''}`}
      onClick={onClick}
      hoverable={!!onClick}
    >
      <div className={styles.statContent}>
        {icon && (
          <div
            className={styles.statIcon}
            style={{ backgroundColor: `${colorMap[color]}15`, color: colorMap[color] }}
          >
            {icon}
          </div>
        )}
        <div className={styles.statInfo}>
          {title && <span style={{ color: 'rgba(0,0,0,0.45)' }}>{title}</span>}
          <div className={styles.statValue}>{value}</div>
          {trend !== 'none' && trendValue && (
            <span style={{ color: trend === 'up' ? '#52c41a' : '#ff4d4f' }}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

// ============================================
// 操作卡片组件
// ============================================

/**
 * 操作卡片组件
 */
export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  actions,
  clickable = false,
  loading = false,
  onClick,
  className,
  footer,
}) => {
  return (
    <Card
      className={`${styles.actionCard} ${clickable ? styles.clickable : ''} ${className || ''}`}
      hoverable={clickable}
      onClick={onClick}
    >
      <div className={styles.actionContent}>
        {icon && <div className={styles.actionIcon}>{icon}</div>}
        <div className={styles.actionInfo}>
          {title && <div className={styles.actionTitle}>{title}</div>}
          {description && <div className={styles.actionDesc}>{description}</div>}
        </div>
        {actions && <div className={styles.actionButtons}>{actions}</div>}
      </div>
      {footer && <div className={styles.actionFooter}>{footer}</div>}
    </Card>
  );
};

// ============================================
// 网格统计卡片组件
// ============================================

export interface GridStatisticProps {
  /** 数据项 */
  items: StatisticCardProps[];
  /** 列数 */
  columns?: number;
  /** 间距 */
  gutter?: [number, number];
  /** 自定义类名 */
  className?: string;
}

/**
 * 网格统计卡片组件
 */
export const GridStatistic: React.FC<GridStatisticProps> = ({
  items,
  columns = 4,
  gutter = [16, 16],
  className,
}) => {
  const colSpan = Math.floor(24 / columns);
  
  return (
    <div 
      className={className}
      style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gutter[1]}px`
      }}
    >
      {items.map((item, index) => (
        <div key={index}>
          <StatisticCard {...item} />
        </div>
      ))}
    </div>
  );
};

// ============================================
// 导出
// ============================================

export default PageContainer;
