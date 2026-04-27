import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  percent?: number;
  showInfo?: boolean;
  strokeColor?: string;
  trailColor?: string;
  type?: 'line' | 'circle';
  status?: 'normal' | 'active' | 'success' | 'exception';
  format?: (percent?: number) => React.ReactNode;
  size?: 'small' | 'default';
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  value, 
  percent = 0, 
  showInfo = false, 
  strokeColor, 
  trailColor,
  type = 'line',
  status,
  format,
  size = 'default',
  ...props 
}, ref) => {
  const displayValue = value ?? percent;
  
  // For circle type, we return a circular progress component
  if (type === 'circle') {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (displayValue / 100) * circumference;
    const statusColor = status === 'success' ? '#52c41a' : status === 'exception' ? '#ff4d4f' : strokeColor || '#1E88E5';
    
    return (
      <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: 120, height: 120 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={trailColor || "#e6e6e6"}
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={statusColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-medium">{Math.round(displayValue)}%</span>
          {status === 'active' && <span className="text-xs text-muted-foreground">处理中...</span>}
        </div>
      </div>
    );
  }
  
  const barClass = size === 'small' ? 'h-1' : 'h-4';
  const indicatorStyle = strokeColor ? { 
    backgroundColor: strokeColor,
    transform: `translateX(-${100 - displayValue}%)` 
  } : undefined;
  
  return (
    <div className={cn("relative inline-flex items-center w-full", className)}>
      <ProgressPrimitive.Root
        ref={ref}
        className={cn("relative w-full overflow-hidden rounded-full bg-secondary", barClass)}
        {...props}
        value={displayValue}
      >
        <ProgressPrimitive.Indicator
          className="h-full w-full flex-1 bg-primary transition-all"
          style={indicatorStyle}
        />
      </ProgressPrimitive.Root>
      {showInfo && (
        <span className={cn("ml-2 text-sm text-muted-foreground", size === 'small' && 'text-xs')}>
          {format ? format(displayValue) : `${Math.round(displayValue)}%`}
        </span>
      )}
    </div>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress }
export type { ProgressProps }