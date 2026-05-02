import { X } from 'lucide-react';
import * as React from "react"

import { cn } from "@/shared/utils/class-names"

import { TextArea as AntDTextarea } from './ui-components';

export interface InputProps extends React.ComponentProps<"input"> {
  icon?: React.ReactNode;
  allowClear?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, allowClear, value, onChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState('');
    const effectiveValue = value ?? internalValue;
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) setInternalValue(e.target.value);
      onChange?.(e);
    };
    const handleClear = () => {
      if (value === undefined) setInternalValue('');
      if (onChange) {
        const synthetic = { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>;
        onChange(synthetic);
      }
    };

    return (
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">{icon}</span>}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            icon && "pl-10",
            className
          )}
          ref={ref}
          value={effectiveValue}
          onChange={handleChange}
          {...props}
        />
        {allowClear && effectiveValue && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear input"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// Textarea component
export const Textarea = AntDTextarea;

export { Input }
