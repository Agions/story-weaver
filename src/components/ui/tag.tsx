import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const tagVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border border-input",
        success: "border-transparent bg-green-100 text-green-800",
        warning: "border-transparent bg-yellow-100 text-yellow-800",
        info: "border-transparent bg-blue-100 text-blue-800",
        blue: "border-transparent bg-blue-100 text-blue-800",
        green: "border-transparent bg-green-100 text-green-800",
        red: "border-transparent bg-red-100 text-red-800",
        yellow: "border-transparent bg-yellow-100 text-yellow-800",
        purple: "border-transparent bg-purple-100 text-purple-800",
        pink: "border-transparent bg-pink-100 text-pink-800",
        gray: "border-transparent bg-gray-100 text-gray-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TagProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tagVariants> {
  color?: string; // for backward compatibility with antd color prop
  icon?: React.ReactNode;
}

function Tag({ className, variant, color, icon, children, style, ...props }: TagProps) {
  // Support antd-style color prop for common colors
  let resolvedVariant: VariantProps<typeof tagVariants>["variant"] = variant;
  if (color && !variant) {
    switch (color) {
      case 'blue': case 'cyan': case 'geekblue': case 'purple': resolvedVariant = 'info'; break;
      case 'green': case 'success': resolvedVariant = 'success'; break;
      case 'red': case 'error': case 'orange': resolvedVariant = 'red'; break;
      case 'yellow': case 'gold': resolvedVariant = 'warning'; break;
      case 'default': case 'gray': resolvedVariant = 'secondary'; break;
      case 'pink': resolvedVariant = 'pink'; break;
      case 'magenta': resolvedVariant = 'pink'; break;
      default: resolvedVariant = 'outline';
    }
  }

  // If color is a custom hex, use it directly
  const computedStyle = color && !['blue', 'cyan', 'geekblue', 'purple', 'green', 'success', 'red', 'error', 'orange', 'yellow', 'gold', 'default', 'gray', 'pink', 'magenta'].includes(color)
    ? { ...style, backgroundColor: color, color: '#fff', borderColor: color }
    : style;

  return (
    <div className={cn(tagVariants({ variant: resolvedVariant }), className)} style={computedStyle} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </div>
  );
}

export { Tag, tagVariants }
