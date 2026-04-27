import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

// AntD-compatible Slider: accepts value as number | number[], onValueChange returns number | number[]
interface AntDSliderProps {
  value?: number | number[];
  defaultValue?: number | number[];
  onValueChange?: (value: number | number[]) => void;
  onChange?: (value: number) => void;
  max?: number;
  min?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  AntDSliderProps & Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'value' | 'defaultValue' | 'onValueChange' | 'onChange'>
>(
  ({ 
    value, 
    defaultValue, 
    onValueChange, 
    onChange, 
    max, 
    min, 
    step, 
    disabled, 
    className, 
    ...props 
  }, ref) => {
    // Normalize to array for Radix
    const normalizedDefault = defaultValue !== undefined 
      ? (Array.isArray(defaultValue) ? defaultValue : [defaultValue])
      : undefined;
    const normalizedValue = value !== undefined
      ? (Array.isArray(value) ? value : [value])
      : undefined;

    const handleValueChange = (newValue: number[]) => {
      const single = newValue[0];
      onValueChange?.(single);
      onChange?.(single);
    };

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        value={normalizedValue}
        defaultValue={normalizedDefault}
        onValueChange={handleValueChange}
        max={max}
        min={min}
        step={step}
        disabled={disabled}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
    );
  }
)
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
