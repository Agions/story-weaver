import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-100 text-green-800 hover:bg-green-100/80",
        warning:
          "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80",
        info:
          "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100/80",
        gold:
          "border-transparent bg-yellow-500 text-white hover:bg-yellow-500/80",
        // antd status colors
        processing: "border-transparent bg-blue-500 text-white",
        error: "border-transparent bg-red-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Status dot component
const statusColors: Record<string, string> = {
  success: 'bg-emerald-500',
  processing: 'bg-blue-500',
  default: 'bg-gray-400',
  error: 'bg-red-500',
  warning: 'bg-orange-500',
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  status?: 'success' | 'processing' | 'default' | 'error' | 'warning';
  text?: React.ReactNode;
  color?: string;
  count?: React.ReactNode;
  dot?: boolean;
}

function Badge({ className, variant, status, text, color, count, dot, children, ...props }: BadgeProps) {
  // antd-style status Badge
  if (status || dot) {
    const dotColor = status ? statusColors[status] : statusColors.default
    return (
      <span className={cn("inline-flex items-center gap-2", className)} {...props}>
        <span
          className={cn("inline-block w-2 h-2 rounded-full", dotColor)}
          style={color ? { backgroundColor: color } : undefined}
        />
        {text && <span className="text-xs">{text}</span>}
      </span>
    )
  }

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
