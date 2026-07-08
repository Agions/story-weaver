import * as React from 'react';

import { cn } from '@/shared/utils/class-names';

// ListItem with generic props
interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

const ListItem = ({ className, onClick, children, ...props }: ListItemProps) => (
  <div
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={
      onClick
        ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') onClick();
          }
        : undefined
    }
    className={cn(
      'flex items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-default',
      onClick && 'cursor-pointer',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// Generic List component
interface ListProps<T = unknown> extends React.HTMLAttributes<HTMLDivElement> {
  dataSource?: T[];
  renderItem?: (item: T, index: number) => React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const List = Object.assign(
  <T = unknown,>({ dataSource, renderItem, className, children, ...props }: ListProps<T>) => {
    // Support List.Item children pattern
    const itemChildren: React.ReactNode[] = [];
    React.Children.forEach(children, (child) => {
      if (
        child &&
        React.isValidElement(child) &&
        (child.type as React.ComponentType).displayName === 'ListItem'
      ) {
        itemChildren.push(child);
      }
    });

    const items = dataSource?.map((item, index) => renderItem?.(item, index)) ?? [];

    if (itemChildren.length > 0) {
      return (
        <div className={cn('', className)} {...props}>
          {itemChildren}
        </div>
      );
    }
    if (!items.length && children) {
      return (
        <div className={cn('', className)} {...props}>
          {children}
        </div>
      );
    }
    return (
      <div className={cn('', className)} {...props}>
        {items}
      </div>
    );
  },
  { Item: ListItem }
);
(ListItem as React.ComponentType).displayName = 'ListItem';

export { List, ListItem };
