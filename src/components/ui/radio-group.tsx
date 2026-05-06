'use client';

import * as React from 'react';

import { cn } from '@/shared/utils/class-names';

// ============================================================
// AntD-compatible Radio Group
// ============================================================

interface RadioOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  optionType?: 'default' | 'button';
  buttonStyle?: 'solid' | 'outline';
  children?: React.ReactNode;
  options?: RadioOption[];
  className?: string;
}

interface RadioButtonProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
}

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
}

const Radio: React.FC<RadioProps> = (props) => (
  <input type="radio" {...props} className={cn('accent-primary', props.className)} />
);

const RadioButton: React.FC<RadioButtonProps> = ({ children, ...props }) => (
  <input type="radio" {...props} className={cn('accent-primary', props.className)} />
);

const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  defaultValue,
  onChange,
  optionType,
  buttonStyle,
  children,
  options,
  className,
}) => {
  if (optionType === 'button') {
    return (
      <div className={cn('flex flex-wrap gap-1', className)} role="radiogroup">
        {(options ?? []).map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled}
            onClick={() => onChange?.(opt.value)}
            className={cn(
              'px-3 py-1.5 text-sm rounded border transition-colors',
              (value ?? defaultValue) === opt.value
                ? buttonStyle === 'solid'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-primary/10 text-primary border-primary'
                : 'bg-background text-foreground border-input hover:bg-accent',
              opt.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {opt.label}
          </button>
        ))}
        {children}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', className)} role="radiogroup">
      {(options ?? []).map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={(value ?? defaultValue) === opt.value}
            onChange={() => onChange?.(opt.value)}
            disabled={opt.disabled}
            className="accent-primary"
          />
          <span className="text-sm">{opt.label}</span>
        </label>
      ))}
      {children}
    </div>
  );
};

// Static properties for AntD compatibility
(
  RadioGroup as unknown as React.ComponentType<RadioGroupProps> & {
    Button: React.FC<RadioButtonProps>;
  }
).Button = RadioButton;

export { Radio, RadioButton, RadioGroup, Radio as RadioGroupItem };
export type { RadioGroupProps, RadioButtonProps, RadioOption };
