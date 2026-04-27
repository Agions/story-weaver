import * as React from "react"
import { cn } from "@/lib/utils"

interface ListItemProps {
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
  [key: string]: any;
}

const ListItem: React.FC<ListItemProps> = ({ className, onClick, children, ...props }) => (
  <div
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    className={cn(
      "flex items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-default",
      onClick && "cursor-pointer",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

interface ListProps {
  dataSource?: any[];
  renderItem?: (item: any, index: number) => React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const List: React.FC<ListProps> = ({ dataSource, renderItem, className, children, ...props }) => {
  const items = dataSource?.map((item, index) => renderItem?.(item, index)) ?? [];
  // Support render prop as children
  if (!items.length && children) {
    return <div className={cn("", className)} {...props}>{children}</div>;
  }
  return <div className={cn("", className)} {...props}>{items}</div>;
};

export { List, ListItem }
