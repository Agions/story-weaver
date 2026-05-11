/**
 * 通用卡片组件
 * 统一卡片样式和行为
 */

import React from 'react';

import { ShadcnCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/shared/utils/class-names';

import styles from './Card.module.less';

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
  /** @deprecated borderless is not implemented yet */
  borderless?: never;
  [key: string]: unknown;
}

export const Card = ({
  children,
  hoverable = false,
  selected = false,
  className,
  size = 'default',
  variant = 'default',
  title,
  extra,
  bodyStyle,
  borderless: _borderless,
  ...props
}: CardProps) => {
  const cardClass = cn(
    styles.card,
    size === 'small' ? styles.small : size === 'large' ? styles.large : '',
    variant === 'outlined' ? styles.outlined : variant === 'filled' ? styles.filled : '',
    hoverable ? styles.hoverable : '',
    selected ? styles.selected : '',
    className
  );

  return (
    <ShadcnCard className={cardClass} {...props}>
      {(title || extra) && (
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          {title && typeof title === 'string' ? <CardTitle>{title}</CardTitle> : title}
          {extra && <div>{extra}</div>}
        </CardHeader>
      )}
      <CardContent style={bodyStyle}>{children}</CardContent>
    </ShadcnCard>
  );
};

export default Card;
