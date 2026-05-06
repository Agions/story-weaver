"use client"

import * as React from "react"
import { cn } from "@/shared/utils/class-names"
import { Card as ShadcnCard } from '@/components/ui/card';

// ============================================================
// Card component (wraps shadcn Card)
// ============================================================
interface CardMetaProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  avatar?: React.ReactNode;
  className?: string;
}

const CardMeta: React.FC<CardMetaProps> = ({ title, description, avatar }) => (
  <div className="flex gap-3">
    {avatar && <div className="flex-shrink-0">{avatar}</div>}
    <div className="flex-1 min-w-0">
      {title && <div className="font-medium text-sm">{title}</div>}
      {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
    </div>
  </div>
);

interface AntdCardProps {
  hoverable?: boolean;
  className?: string;
  cover?: React.ReactNode;
  actions?: React.ReactNode[];
  children?: React.ReactNode;
  size?: 'small' | 'default';
  extra?: React.ReactNode;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
}

const AntdCardBase: React.FC<AntdCardProps> = ({
  hoverable,
  className,
  cover,
  actions,
  children,
  size: _size,
  extra,
  title,
  footer,
  onClick,
  style,
}) => (
  <ShadcnCard className={cn(hoverable && "hover:shadow-md transition-shadow cursor-pointer", className)} onClick={onClick} style={style}>
    {title && (
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">{title}</div>
        {extra && <div>{extra}</div>}
      </div>
    )}
    {cover && <div className="p-4">{cover}</div>}
    <div className="p-4">
      {children}
      {extra && !title && <div className="mt-2">{extra}</div>}
    </div>
    {actions && actions.length > 0 && (
      <div className="flex border-t divide-x">
        {actions.map((action, i) => (
          <div key={i} className="flex-1 flex justify-center py-2 hover:bg-muted/50">{action}</div>
        ))}
      </div>
    )}
    {footer && <div className="px-6 py-4 border-t">{footer}</div>}
  </ShadcnCard>
);
(AntdCardBase as any).Meta = CardMeta;
const AntdCard = AntdCardBase as unknown as React.FC<AntdCardProps> & { Meta: React.FC<CardMetaProps> };

export { AntdCard as Card, CardMeta, type AntdCardProps, type CardMetaProps }
