/**
 * 通用卡片组件
 * 统一卡片样式和行为
 */

import React from 'react';
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import styles from './index.module.less';

interface CardProps {
  hoverable?: boolean;
  selected?: boolean;
  className?: string;
  size?: 'small' | 'default' | 'large';
  variant?: 'default' | 'outlined' | 'filled';
  title?: React.ReactNode;
  extra?: React.ReactNode;
  children?: React.ReactNode;
  bodyStyle?: React.CSSProperties;
  borderless?: boolean;
  [key: string]: unknown;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  selected = false,
  className,
  size = 'default',
  variant = 'default',
  title,
  extra,
  bodyStyle,
  borderless = false,
  ...props
}) => {
  const cardClass = cn(
    styles.card,
    size === 'small' ? styles.small : size === 'large' ? styles.large : '',
    variant === 'outlined' ? styles.outlined : variant === 'filled' ? styles.filled : '',
    hoverable ? styles.hoverable : '',
    selected ? styles.selected : '',
    className
  );
  
  return (
    <ShadcnCard
      className={cardClass}
      {...props}
    >
      {(title || extra) && (
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          {title && typeof title === 'string' ? <CardTitle>{title}</CardTitle> : title}
          {extra && <div>{extra}</div>}
        </CardHeader>
      )}
      <CardContent style={bodyStyle}>
        {children}
      </CardContent>
    </ShadcnCard>
  );
};

export default Card;