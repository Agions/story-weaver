"use client"

import * as React from "react"
import { cn } from "@/shared/utils/class-names"

// ============================================================
// ColorPicker component (simple color input)
// ============================================================
interface ColorPickerProps {
  value?: string;
  onChange?: (color: { toHexString: () => string }) => void;
  showText?: boolean;
  size?: 'small' | 'middle' | 'large';
  className?: string;
  style?: React.CSSProperties;
  presetColors?: string[];
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  showText,
  size = 'middle',
  className,
  style,
}) => {
  const [internalValue, setInternalValue] = React.useState(value ?? '#000000');
  const sizeClass = size === 'small' ? 'w-6 h-6' : size === 'large' ? 'w-10 h-10' : 'w-8 h-8';

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (value) setInternalValue(value);
     
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInternalValue(newVal);
    onChange?.({
      toHexString: () => newVal,
    } as any);
  };

  return (
    <div className={cn("flex items-center gap-2", className)} style={style}>
      <input
        type="color"
        value={internalValue}
        onChange={handleChange}
        className={cn("rounded border cursor-pointer", sizeClass)}
      />
      {showText && (
        <span className="text-xs text-muted-foreground font-mono">{internalValue}</span>
      )}
    </div>
  );
};

export { ColorPicker, type ColorPickerProps }
