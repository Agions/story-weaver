import * as React from "react"
import { cn } from "@/shared/utils/class-names"

// ============================================================
// AntD-compatible TextArea component
// ============================================================
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  rows?: number;
  showCount?: boolean;
  maxLength?: number;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ rows = 3, showCount, maxLength, className, value, ...props }, ref) => (
    <div className="relative">
      <textarea
        ref={ref}
        rows={rows}
        maxLength={maxLength}
        value={value}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      {showCount && maxLength && value !== undefined && (
        <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">
          {String(value).length}/{maxLength}
        </div>
      )}
    </div>
  )
);
TextArea.displayName = 'TextArea';

export { TextArea, type TextAreaProps }
