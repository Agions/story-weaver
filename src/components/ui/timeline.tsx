import * as React from 'react';

import { cn } from '@/shared/utils/class-names';

interface TimelineItemProps {
  dot?: React.ReactNode;
  color?: string;
  children: React.ReactNode;
  className?: string;
}

function TimelineItem({ dot, color, children, className }: TimelineItemProps) {
  return (
    <div className={cn('flex gap-3 pb-6 relative', className)}>
      {/* Vertical line */}
      <div className="flex flex-col items-center">
        <div
          className="w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1"
          style={
            color
              ? { backgroundColor: color, borderColor: color }
              : { borderColor: 'hsl(var(--primary))' }
          }
        />
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      {/* Content */}
      <div className="flex-1 pt-0">
        {dot && <div className="mb-1">{dot}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
}

interface TimelineProps {
  className?: string;
  children: React.ReactNode;
}

function Timeline({ className, children }: TimelineProps) {
  return <div className={cn('flex flex-col', className)}>{children}</div>;
}

export { Timeline, TimelineItem };
