'use client';

import * as React from 'react';

import { cn } from '@/shared/utils/class-names';

// ============================================================
// Shadcn Card Primitive Components (inline - no external shadcn dep)
// ============================================================

function ShadcnCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}

function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-semibold leading-none tracking-tight', className)}
      aria-label={children ? undefined : 'Card title'}
      {...props}
    >
      {children}
    </h3>
  );
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />;
}

// ============================================================
// CardMeta - AntD-style meta component (avatar + title + description)
// ============================================================
interface CardMetaProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  avatar?: React.ReactNode;
  className?: string;
}

function CardMeta({ title, description, avatar }: CardMetaProps) {
  return (
    <div className="flex gap-3">
      {avatar && <div className="flex-shrink-0">{avatar}</div>}
      <div className="flex-1 min-w-0">
        {title && <div className="font-medium text-sm">{title}</div>}
        {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
      </div>
    </div>
  );
}

// ============================================================
// AntdCard - AntD-compatible Card with hoverable/cover/actions/extra/title props
// ============================================================
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

function AntdCard({
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
}: AntdCardProps) {
  return (
    <ShadcnCard
      className={cn(hoverable && 'hover:shadow-md transition-shadow cursor-pointer', className)}
      onClick={onClick}
      style={style}
    >
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
            <div key={i} className="flex-1 flex justify-center py-2 hover:bg-muted/50">
              {action}
            </div>
          ))}
        </div>
      )}
      {footer && <div className="px-6 py-4 border-t">{footer}</div>}
    </ShadcnCard>
  );
}
(AntdCard as any).Meta = CardMeta;

// ============================================================
// Exports
// - ShadcnCard: base primitive (for shared/components/ui/Card.tsx compatibility)
// - Card (alias of AntdCard): for general use with AntD-style props
// - CardHeader/Title/Description/Content/Footer: shadcn sub-components
// ============================================================
export {
  ShadcnCard,
  AntdCard as Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardMeta,
  type AntdCardProps,
  type CardMetaProps,
};
