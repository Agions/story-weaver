"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button as ShadcnButton } from '@/components/ui/button';
import { Input as ShadcnInput } from '@/components/ui/input';
import { List as ShadcnList, ListItem } from '@/components/ui/list';
import { Tag as ShadcnTag } from '@/components/ui/tag';
import { toast } from 'sonner';
import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useForm as useRhfForm } from 'react-hook-form';
import { Text as ShadcnText, Title as ShadcnTitle, Paragraph as ShadcnParagraph } from '@/components/ui/typography';
import { Card as ShadcnCard } from '@/components/ui/card';
import { User } from 'lucide-react';

// ============================================================
// AntD-compatible Form (wraps react-hook-form + shadcn)
// ============================================================

interface FormProps {
  form?: any;
  layout?: 'vertical' | 'horizontal' | 'inline';
  onFinish?: (values: any) => void;
  initialValues?: Record<string, any>;
  className?: string;
  children?: React.ReactNode;
}

const Form: React.FC<FormProps> = ({
  form,
  layout = 'vertical',
  onFinish,
  initialValues,
  className,
  children,
}) => {
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (form) {
          form.submit();
        }
        if (onFinish) {
          const formData = new FormData(e.currentTarget);
          const values: Record<string, any> = {};
          formData.forEach((v, k) => { values[k] = v; });
          // Merge with initialValues if form has them
          if (form && initialValues) {
            Object.assign(values, initialValues);
          }
          onFinish(values);
        }
      }}
      style={{ display: 'flex', flexDirection: layout === 'vertical' ? 'column' : 'row', gap: layout === 'horizontal' ? '1rem' : 0 }}
    >
      {/* react-hook-form needs special handling, fall through for now */}
      {children}
    </form>
  );
};

interface FormItemProps {
  name?: string;
  label?: React.ReactNode;
  rules?: any[];
  dependencies?: string[];
  children: React.ReactNode;
  className?: string;
}

const FormItem: React.FC<FormItemProps> = ({
  name,
  label,
  rules,
  children,
  className,
}) => {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      {children}
    </div>
  );
};

// ============================================================
// AntD-compatible Select with options prop
// ============================================================
interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

interface AntDSelectProps {
  value?: string | string[];
  defaultValue?: string | string[];
  onChange?: (value: string | string[]) => void;
  options?: SelectOption[];
  mode?: 'multiple' | 'tags';
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

const AntDSelect: React.FC<AntDSelectProps> = ({
  value,
  defaultValue,
  onChange,
  options,
  mode,
  placeholder,
  style,
  className,
  disabled,
  children,
}) => {
  const [internalValue, setInternalValue] = React.useState<string | string[]>(
    (defaultValue as string | string[]) || (mode === 'tags' ? [] : '')
  );

  React.useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

  const handleValueChange = (newValue: string) => {
    if (mode === 'tags') {
      // For tags mode, add to existing tags
      const current = Array.isArray(internalValue) ? internalValue : [];
      const updated = [...current, newValue];
      setInternalValue(updated);
      onChange?.(updated);
    } else {
      setInternalValue(newValue);
      onChange?.(newValue as string);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (mode === 'tags') {
      const updated = (internalValue as string[]).filter(t => t !== tagToRemove);
      setInternalValue(updated);
      onChange?.(updated);
    }
  };

  if (mode === 'tags') {
    const tags = Array.isArray(internalValue) ? internalValue : [];
    return (
      <div className={cn("flex flex-col gap-1", className)} style={style}>
        <div className="flex flex-wrap gap-1 min-h-[38px] p-1 border border-input rounded-md bg-background">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-sm rounded"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-destructive ml-1"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 min-w-[80px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                e.preventDefault();
                const newTag = e.currentTarget.value.trim();
                if (!(internalValue as string[]).includes(newTag)) {
                  handleValueChange(newTag);
                }
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
        {options && (
          <select
            className="hidden"
            onChange={(e) => {
              if (e.target.value) handleValueChange(e.target.value);
            }}
          >
            <option value="">选择预设</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
      </div>
    );
  }

  return (
    <ShadcnSelect
      value={value as string}
      defaultValue={defaultValue as string}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger style={style} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options?.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </SelectItem>
        ))}
        {children}
      </SelectContent>
    </ShadcnSelect>
  );
};

// ============================================================
// AntD-compatible Radio.Group with button style
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
      <div className={cn("flex flex-wrap gap-1", className)} role="radiogroup">
        {(options || []).map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled}
            onClick={() => onChange?.(opt.value)}
            className={cn(
              "px-3 py-1.5 text-sm rounded border transition-colors",
              (value ?? defaultValue) === opt.value
                ? buttonStyle === 'solid'
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-primary/10 text-primary border-primary"
                : "bg-background text-foreground border-input hover:bg-accent",
              opt.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {opt.label}
          </button>
        ))}
        {/* Also support children pattern */}
        {children}
      </div>
    );
  }
  
  return (
    <div className={cn("flex flex-col gap-1", className)} role="radiogroup">
      {(options || []).map((opt) => (
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

interface RadioButtonProps {
  value?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

const RadioButton: React.FC<RadioButtonProps> = ({ children, ...props }) => (
  <RadioGroup {...props} options={[{ value: props.value || '', label: children || '' }]} />
);

const Radio: React.FC<any> = (props) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="radio" {...props} className="accent-primary" />
    <span className="text-sm">{props.children}</span>
  </label>
);

// ============================================================
// Space component (flex gap wrapper)
// ============================================================
interface SpaceProps {
  direction?: 'horizontal' | 'vertical';
  size?: 'small' | 'middle' | 'large' | number;
  align?: 'start' | 'end' | 'center' | 'baseline';
  className?: string;
  children?: React.ReactNode;
}

const Space: React.FC<SpaceProps> = ({
  direction = 'horizontal',
  size = 'small',
  align,
  className,
  children,
}) => {
  const gapMap: Record<string, string> = {
    small: '0.25rem',
    middle: '0.5rem',
    large: '1rem',
  };
  const gap = typeof size === 'number' ? `${size}px` : gapMap[size] || '0.5rem';
  
  return (
    <div
      className={cn("flex", direction === 'vertical' ? 'flex-col' : 'flex-row', className)}
      style={{
        gap,
        alignItems: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align === 'baseline' ? 'baseline' : 'center',
      }}
    >
      {children}
    </div>
  );
};

// ============================================================
// AntD-compatible Modal (wraps shadcn Dialog)
// ============================================================
interface ModalProps {
  open?: boolean;
  onCancel?: () => void;
  onOk?: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
  children?: React.ReactNode;
  className?: string;
  maskClosable?: boolean;
  closable?: boolean;
  destroyOnClose?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onCancel,
  onOk,
  title,
  footer,
  width = 520,
  children,
  className,
  maskClosable = true,
  closable = true,
}) => {
  const [isOpen, setIsOpen] = React.useState(open ?? false);

  React.useEffect(() => {
    if (open !== undefined) setIsOpen(open);
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onCancel?.();
    }
    setIsOpen(newOpen);
  };

  const handleCancel = () => {
    onCancel?.();
    setIsOpen(false);
  };

  const handleOk = () => {
    onOk?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={className}
        style={{ maxWidth: typeof width === 'number' ? width : width }}
        onPointerDownOutside={(e) => {
          if (!maskClosable) e.preventDefault();
        }}
      >
        {closable && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
          </DialogHeader>
        )}
        {title && !closable && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        <div className="py-2">{children}</div>
        {footer && <div className="flex justify-end gap-2 mt-4">{footer}</div>}
        {footer === undefined && onOk && (
          <DialogFooter>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleOk}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              确定
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ============================================================
// AntD-compatible Button
// ============================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  size?: 'small' | 'middle' | 'large';
  icon?: React.ReactNode;
  shape?: 'default' | 'circle' | 'round';
  block?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  type = 'default',
  size = 'middle',
  icon,
  shape = 'default',
  block,
  className,
  children,
  disabled,
  ...props
}) => {
  const sizeClass = size === 'small' ? 'h-8 px-3 text-xs' : size === 'large' ? 'h-11 px-6 text-base' : 'h-10 px-4 text-sm';
  const shapeClass = shape === 'circle' ? 'rounded-full px-0 w-10' : shape === 'round' ? 'rounded-full' : 'rounded-md';
  const typeClass = type === 'primary' ? 'bg-primary text-primary-foreground hover:bg-primary/90' :
                    type === 'dashed' ? 'border border-dashed border-input hover:bg-accent' :
                    type === 'link' ? 'text-primary underline hover:no-underline' :
                    type === 'text' ? 'hover:bg-accent' :
                    'bg-background border border-input hover:bg-accent';

  return (
    <button
      type={props.htmlType || 'button'}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        sizeClass,
        shapeClass,
        typeClass,
        block && "w-full",
        className
      )}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

// ============================================================
// AntD-compatible Input (native input wrapper)
// ============================================================
interface AntDInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'large' | 'small' | 'middle';
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const AntDInput = React.forwardRef<HTMLInputElement, AntDInputProps>(
  ({ size = 'middle', prefix, suffix, className, ...props }, ref) => {
    const sizeClass = size === 'large' ? 'h-11' : size === 'small' ? 'h-8' : 'h-10';
    return (
      <div className={cn("flex items-center border border-input rounded-md bg-background px-3 py-1 focus-within:ring-2 focus-within:ring-ring", className)}>
        {prefix && <span className="mr-2 text-muted-foreground">{prefix}</span>}
        <input ref={ref} className={cn("flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground", sizeClass)} {...props} />
        {suffix && <span className="ml-2 text-muted-foreground">{suffix}</span>}
      </div>
    );
  }
);
AntDInput.displayName = 'AntDInput';

// ============================================================
// AntD-compatible List
// ============================================================
interface ListWrapperProps {
  size?: 'small' | 'middle' | 'large';
  className?: string;
  children: React.ReactNode;
}

const ListWrapper: React.FC<ListWrapperProps> = ({ size, className, children }) => (
  <ShadcnList className={className}>{children}</ShadcnList>
);

// ============================================================
// AntD-compatible Tag
// ============================================================
const AntdTag: React.FC<any> = ({ children, color, ...props }) => (
  <ShadcnTag color={color} {...props}>{children}</ShadcnTag>
);

// ============================================================
// InputNumber component (native number input wrapper)
// ============================================================
interface InputNumberProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: 'large' | 'small' | 'middle';
  style?: React.CSSProperties;
  className?: string;
}

const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  ({ value, defaultValue, onChange, min, max, step, size, style, className, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<number | undefined>(defaultValue ?? value);

    React.useEffect(() => {
      if (value !== undefined) setInternalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value === '' ? null : parseFloat(e.target.value);
      setInternalValue(val ?? undefined);
      onChange?.(val);
    };

    const sizeClass = size === 'large' ? 'h-11' : size === 'small' ? 'h-8' : 'h-10';

    return (
      <input
        ref={ref}
        type="number"
        value={internalValue ?? ''}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          sizeClass,
          className
        )}
        style={style}
        {...props}
      />
    );
  }
);
InputNumber.displayName = 'InputNumber';

// ============================================================
// Divider component
// ============================================================
interface DividerProps {
  orientation?: 'left' | 'right' | 'center';
  className?: string;
  children?: React.ReactNode;
}

const Divider: React.FC<DividerProps> = ({ orientation = 'left', className, children }) => {
  if (children) {
    return (
      <div className={cn("relative my-4", className)}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-2 text-xs text-muted-foreground">{children}</span>
        </div>
      </div>
    );
  }
  return <div className={cn("my-4 border-t border-border", className)} />;
};

// ============================================================
// Row and Col components (flex grid wrappers)
// ============================================================
interface RowProps {
  gutter?: number | [number, number];
  align?: 'top' | 'middle' | 'bottom' | 'stretch';
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
  className?: string;
  children?: React.ReactNode;
}

const Row: React.FC<RowProps> = ({ gutter, align, justify, className, children }) => {
  const [gx, gy = 0] = Array.isArray(gutter) ? gutter : [gutter ?? 0, 0];
  return (
    <div
      className={cn("flex flex-wrap", className)}
      style={{
        gap: gy ? `${gy}px ${gx}px` : `${gx}px`,
        alignItems: align === 'top' ? 'flex-start' : align === 'middle' ? 'center' : align === 'bottom' ? 'flex-end' : 'stretch',
        justifyContent: justify === 'start' ? 'flex-start' : justify === 'end' ? 'flex-end' : justify === 'center' ? 'center' : justify === 'space-around' ? 'space-around' : justify === 'space-between' ? 'space-between' : 'flex-start',
      }}
    >
      {children}
    </div>
  );
};

interface ColProps {
  span?: number;
  offset?: number;
  className?: string;
  children?: React.ReactNode;
}

const Col: React.FC<ColProps> = ({ span = 24, offset, className, children }) => (
  <div
    className={cn(className)}
    style={{
      flexBasis: `${(span / 24) * 100}%`,
      maxWidth: `${(span / 24) * 100}%`,
      paddingLeft: offset ? `${(offset / 24) * 100}%` : undefined,
    }}
  >
    {children}
  </div>
);

// ============================================================
// Collapse (wraps existing Accordion)
// ============================================================
interface CollapseProps {
  activeKey?: string | string[];
  defaultActiveKey?: string | string[];
  onChange?: (key: string | string[]) => void;
  accordion?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface CollapsePanelProps {
  key?: string;
  header?: React.ReactNode;
  children?: React.ReactNode;
}

const CollapsePanel: React.FC<CollapsePanelProps> = ({ header, children }) => null;

const Collapse: React.FC<CollapseProps> & { Panel: React.FC<CollapsePanelProps> } = ({
  activeKey,
  defaultActiveKey,
  onChange,
  accordion,
  className,
  children,
}) => {
  const getDefaultActiveKey = () => {
    if (defaultActiveKey === undefined) return [];
    return Array.isArray(defaultActiveKey) ? defaultActiveKey : [defaultActiveKey];
  };

  const [activeKeys, setActiveKeys] = React.useState<Set<string>>(new Set(getDefaultActiveKey()));

  React.useEffect(() => {
    if (activeKey !== undefined) {
      setActiveKeys(new Set(Array.isArray(activeKey) ? activeKey : [activeKey]));
    }
  }, [activeKey]);

  const toggleKey = (key: string) => {
    let newKeys: Set<string>;
    if (accordion) {
      newKeys = activeKeys.has(key) ? new Set() : new Set([key]);
    } else {
      newKeys = new Set(activeKeys);
      if (newKeys.has(key)) newKeys.delete(key);
      else newKeys.add(key);
    }
    setActiveKeys(newKeys);
    const result = accordion ? [...newKeys][0] || '' : [...newKeys];
    onChange?.(newKeys.size === 0 ? (Array.isArray(activeKey) ? [] : '') as any : result as any);
  };

  // Parse children to extract panels
  const panels: { key: string; header: React.ReactNode; children: React.ReactNode }[] = [];
  React.Children.forEach(children, (child: any) => {
    if (child?.props?.key) {
      panels.push({
        key: String(child.props.key),
        header: child.props.header,
        children: child.props.children,
      });
    }
  });

  return (
    <div className={cn("flex flex-col border rounded-md", className)}>
      {panels.map((panel) => {
        const isOpen = activeKeys.has(panel.key);
        return (
          <div key={panel.key} className="border-b last:border-b-0">
            <button
              type="button"
              onClick={() => toggleKey(panel.key)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:underline bg-background"
            >
              <span>{panel.header}</span>
              <span className={cn("transition-transform", isOpen ? "rotate-180" : "")}>▼</span>
            </button>
            {isOpen && <div className="px-4 pb-4 text-sm">{panel.children}</div>}
          </div>
        );
      })}
    </div>
  );
};
(Collapse as any).Panel = CollapsePanel;

// ============================================================
// Card component (wraps shadcn Card)
// ============================================================
interface CardMetaProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  avatar?: React.ReactNode;
  className?: string;
}

const CardMeta: React.FC<CardMetaProps> = ({ title, description, avatar }) => (
  <div className="flex gap-3">
    {avatar && <div className="flex-shrink-0">{avatar}</div>}
    <div className="flex-1 min-w-0">
      {title && <div className="font-medium text-sm">{title}</div>}
      {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
    </div>
  </div>
);

interface AntdCardProps {
  hoverable?: boolean;
  className?: string;
  cover?: React.ReactNode;
  actions?: React.ReactNode[];
  children?: React.ReactNode;
  size?: 'small' | 'default';
  extra?: React.ReactNode;
}

const AntdCard: React.FC<AntdCardProps> & { Meta: React.FC<CardMetaProps> } = ({
  hoverable,
  className,
  cover,
  actions,
  children,
  size,
  extra,
}) => (
  <ShadcnCard className={cn(hoverable && "hover:shadow-md transition-shadow cursor-pointer", className)}>
    {cover && <div className="p-4">{cover}</div>}
    <div className="p-4">
      {children}
      {extra && <div className="mt-2">{extra}</div>}
    </div>
    {actions && actions.length > 0 && (
      <div className="flex border-t divide-x">
        {actions.map((action, i) => (
          <div key={i} className="flex-1 flex justify-center py-2 hover:bg-muted/50">{action}</div>
        ))}
      </div>
    )}
  </ShadcnCard>
);
(AntdCard as any).Meta = CardMeta;

// ============================================================
// Option component (for Select children)
// ============================================================
interface OptionProps {
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
  key?: string;
}

const Option: React.FC<OptionProps> = ({ children, ...props }) => (
  <option {...props}>{children}</option>
);

// ============================================================
// TextArea component
// ============================================================
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  rows?: number;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ rows = 3, className, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
TextArea.displayName = 'TextArea';

// ============================================================
// message API (wraps sonner toast)
// ============================================================
const message = {
  success: (content: React.ReactNode) => toast.success(String(content)),
  error: (content: React.ReactNode) => toast.error(String(content)),
  warning: (content: React.ReactNode) => toast.warning(String(content)),
  info: (content: React.ReactNode) => toast.info(String(content)),
  loading: (content: React.ReactNode) => toast.loading(String(content)),
};

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
  const [internalValue, setInternalValue] = React.useState(value || '#000000');
  const sizeClass = size === 'small' ? 'w-6 h-6' : size === 'large' ? 'w-10 h-10' : 'w-8 h-8';

  React.useEffect(() => {
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

// ============================================================
// Upload component
// ============================================================
interface UploadProps {
  listType?: 'text' | 'picture' | 'picture-card';
  showUploadList?: boolean;
  beforeUpload?: (file: File) => boolean | Promise<boolean>;
  accept?: string;
  children?: React.ReactNode;
  onChange?: (info: any) => void;
  className?: string;
}

const Upload: React.FC<UploadProps> = ({
  listType,
  showUploadList,
  beforeUpload,
  accept,
  children,
  onChange,
  className,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const rcFile = file as any;
      rcFile.uid = Math.random().toString(36).slice(2);
      onChange?.({ file: rcFile, fileList: [rcFile] });
      if (beforeUpload) {
        beforeUpload(file);
      }
    }
  };

  if (listType === 'picture-card') {
    return (
      <div
        className={cn(
          "w-24 h-24 rounded-md border-2 border-dashed border-input flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors",
          className
        )}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />
        {children}
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
      <div onClick={() => inputRef.current?.click()} className="cursor-pointer inline-flex">
        {children}
      </div>
    </div>
  );
};

// ============================================================
// Avatar with size prop (wraps shadcn Avatar)
// ============================================================

interface AntDAvatarProps {
  size?: number | 'small' | 'large' | 'default';
  src?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const AntDAvatar: React.FC<AntDAvatarProps> = ({ size = 'default', src, icon, className, children }) => {
  const sizeMap: Record<string, number> = { small: 24, default: 40, large: 64 };
  const pxSize = typeof size === 'number' ? size : sizeMap[size] || 40;

  if (children) {
    return (
      <ShadcnAvatar style={{ width: pxSize, height: pxSize }} className={className}>
        <AvatarFallback className="text-sm" style={{ width: pxSize, height: pxSize }}>
          {children}
        </AvatarFallback>
      </ShadcnAvatar>
    );
  }

  if (src) {
    return (
      <ShadcnAvatar style={{ width: pxSize, height: pxSize }} className={className}>
        <AvatarImage src={src} style={{ width: pxSize, height: pxSize }} />
        <AvatarFallback style={{ width: pxSize, height: pxSize }}>
          {icon || <User />}
        </AvatarFallback>
      </ShadcnAvatar>
    );
  }

  return (
    <ShadcnAvatar style={{ width: pxSize, height: pxSize }} className={className}>
      <AvatarFallback style={{ width: pxSize, height: pxSize }}>
        {icon || <User />}
      </AvatarFallback>
    </ShadcnAvatar>
  );
};

// ============================================================
// Typography (Text, Title, Paragraph)
// ============================================================
import { Text as ShadcnText, Title as ShadcnTitle, Paragraph as ShadcnParagraph } from '@/components/ui/typography';

// ============================================================
// useForm hook (antd-style form instance)
// ============================================================
import { useForm as useRhfForm, useFormContext as useRhfFormContext } from 'react-hook-form';

interface UseFormReturn {
  getValues: () => any;
  setFieldsValue: (values: any) => void;
  validateFields: () => Promise<any>;
  resetFields: () => void;
  submit: () => void;
}

function useForm(): [any, UseFormReturn] {
  const methods = useRhfForm();
  const form: UseFormReturn = {
    getValues: () => methods.getValues(),
    setFieldsValue: (values) => methods.reset(values as any),
    validateFields: async () => {
      try {
        const values = await methods.trigger();
        if (values) return methods.getValues();
        throw new Error('validation failed');
      } catch {
        throw new Error('validation failed');
      }
    },
    resetFields: () => methods.reset(),
    submit: () => methods.handleSubmit(() => {})(),
  };
  return [{}, form];
}

export {
  Form,
  FormItem,
  AntDSelect as Select,
  RadioGroup,
  Radio,
  RadioButton,
  Space,
  Modal,
  InputNumber,
  Divider,
  Row,
  Col,
  Collapse,
  CollapsePanel,
  AntdCard as Card,
  CardMeta,
  Option,
  TextArea,
  message,
  ColorPicker,
  Upload,
  AntDAvatar as Avatar,
  ShadcnText as Text,
  ShadcnTitle as Title,
  ShadcnParagraph as Paragraph,
  useForm,
  Button,
  AntDInput as Input,
  ListWrapper as List,
  ListItem,
  AntdTag as Tag,
  type FormProps,
  type FormItemProps,
  type AntDSelectProps,
  type RadioGroupProps,
  type RadioOption,
  type ModalProps,
  type InputNumberProps,
  type DividerProps,
  type RowProps,
  type ColProps,
  type CollapseProps,
  type CollapsePanelProps,
  type CardMetaProps,
  type OptionProps,
  type TextAreaProps,
  type ColorPickerProps,
  type UploadProps,
  type AntDAvatarProps,
  type ButtonProps,
  type AntDInputProps,
  type ListWrapperProps,
};
