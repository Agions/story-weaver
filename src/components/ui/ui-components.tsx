'use client';

/**
 * AntD-compatible UI Components
 *
 * This file re-exports components from both shadcn/ui and custom AntD-compatible wrappers.
 * Individual components have been split into separate files for better code organization.
 *
 * @deprecated Import from individual component files directly for tree-shaking
 */

// ============================================================
// Re-export from shadcn/ui components
// ============================================================

import { User } from 'lucide-react';
import * as React from 'react';
import { useForm as useRhfForm, type UseFormReturn as RhfUseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import {
  LegacyAvatar as AntDAvatar,
  type LegacyAvatarProps as AntDAvatarProps,
  Avatar as AvatarDirect,
  type LegacyAvatarProps as AvatarProps,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  Card as AntdCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardMeta,
  type CardMetaProps,
} from '@/components/ui/card';
import { ColorPicker, type ColorPickerProps } from '@/components/ui/color-picker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Dropdown as LegacyDropdown } from '@/components/ui/dropdown';
import {
  DropdownMenu as DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Empty as ShadcnEmpty } from '@/components/ui/empty';
import { Row, Col, type RowProps, type ColProps } from '@/components/ui/grid';
import { List as ShadcnList, ListItem } from '@/components/ui/list';
import { message } from '@/components/ui/message';
import { Modal, type ModalProps } from '@/components/ui/modal';
import { Option, type OptionProps } from '@/components/ui/option';
import { Popconfirm, type PopconfirmProps } from '@/components/ui/popconfirm';
import { Progress as ShadcnProgress } from '@/components/ui/progress';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  LegacySelect as AntDSelect,
  type LegacySelectProps,
} from '@/components/ui/select';
import { Tag as ShadcnTag } from '@/components/ui/tag';
import { TextArea, Textarea, type TextAreaProps } from '@/components/ui/textarea';
import {
  Text as ShadcnText,
  Title as ShadcnTitle,
  Paragraph as ShadcnParagraph,
} from '@/components/ui/typography';
import { Upload, type UploadProps } from '@/components/ui/upload';
import { cn } from '@/shared/utils/class-names';

// ============================================================
// AntD-compatible Form (wraps react-hook-form + shadcn)
// ============================================================

// Form values type
type FormValues = Record<string, unknown>;

// Validation rule type (simplified)
interface ValidationRule {
  required?: boolean;
  message?: string;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (value: unknown) => boolean | Promise<boolean>;
}

interface FormProps {
  form?: RhfUseFormReturn<FormValues>;
  layout?: 'vertical' | 'horizontal' | 'inline';
  onFinish?: (values: FormValues) => void;
  initialValues?: FormValues;
  className?: string;
  children?: React.ReactNode;
  Item?: typeof FormItem;
}

function Form({
  form,
  layout = 'vertical',
  onFinish,
  initialValues,
  className,
  children,
}: FormProps) {
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (form) {
          form.handleSubmit((data) => {
            onFinish?.(data as FormValues);
          })();
        }
        if (onFinish) {
          const formData = new FormData(e.currentTarget);
          const values: Record<string, any> = {};
          formData.forEach((v, k) => {
            values[k] = v;
          });
          // Merge with initialValues if form has them
          if (form && initialValues) {
            Object.assign(values, initialValues);
          }
          onFinish(values);
        }
      }}
      style={{
        display: 'flex',
        flexDirection: layout === 'vertical' ? 'column' : 'row',
        gap: layout === 'horizontal' ? '1rem' : 0,
      }}
    >
      {/* react-hook-form needs special handling, fall through for now */}
      {children}
    </form>
  );
}

// Form.Item as a property on Form - defined after FormItem declaration
interface FormItemProps {
  name?: string | string[];
  label?: React.ReactNode;
  rules?: ValidationRule[];
  dependencies?: string[];
  children: React.ReactNode;
  className?: string;
}

function FormItem({ label, children, className }: FormItemProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      {children}
    </div>
  );
}

(Form as any).Item = FormItem;

// ============================================================
// AntD-compatible Select with options prop
// ============================================================
interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

interface LegacySelectProps {
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

function LegacySelect({
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
}: LegacySelectProps) {
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
      const updated = (internalValue as string[]).filter((t) => t !== tagToRemove);
      setInternalValue(updated);
      onChange?.(updated);
    }
  };

  if (mode === 'tags') {
    const tags = Array.isArray(internalValue) ? internalValue : [];
    return (
      <div className={cn('flex flex-col gap-1', className)} style={style}>
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
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
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
}

// Add .Group and .Button as static properties to Radio for style usage

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

function RadioGroup({
  value,
  defaultValue,
  onChange,
  optionType,
  buttonStyle,
  children,
  options,
  className,
}: RadioGroupProps) {
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
        {/* Also support children pattern */}
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
}

interface RadioButtonProps {
  value?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

function RadioButton({ children, ...props }: RadioButtonProps) {
  return <RadioGroup {...props} options={[{ value: props.value ?? '', label: children ?? '' }]} />;
}

function Radio(props: React.ComponentPropsWithoutRef<'input'>) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="radio" {...props} className="accent-primary" />
      <span className="text-sm">{props.children}</span>
    </label>
  );
}

(Radio as unknown as { Group: typeof RadioGroup; Button: typeof RadioButton }).Group = RadioGroup;
(Radio as unknown as { Group: typeof RadioGroup; Button: typeof RadioButton }).Button = RadioButton;

// ============================================================
// Space component (flex gap wrapper)
// ============================================================
interface SpaceProps {
  direction?: 'horizontal' | 'vertical';
  size?: 'small' | 'middle' | 'large' | number;
  align?: 'start' | 'end' | 'center' | 'baseline';
  className?: string;
  children?: React.ReactNode;
  wrap?: boolean;
  style?: React.CSSProperties;
  block?: boolean;
  compact?: boolean;
}

const Space = (({
  direction = 'horizontal',
  size = 'small',
  align,
  className,
  children,
  wrap,
  style,
  block,
  compact,
}: SpaceProps) => {
  const gapMap: Record<string, string> = {
    small: '0.25rem',
    middle: '0.5rem',
    large: '1rem',
  };
  const gap = typeof size === 'number' ? `${size}px` : gapMap[size] || '0.5rem';

  return (
    <div
      className={cn(
        'flex',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        wrap && 'flex-wrap',
        block && 'w-full',
        className
      )}
      style={{
        gap: compact ? 0 : gap,
        alignItems:
          align === 'start'
            ? 'flex-start'
            : align === 'end'
              ? 'flex-end'
              : align === 'baseline'
                ? 'baseline'
                : 'center',
        ...style,
      }}
    >
      {children}
    </div>
  );
}) as unknown as any & {
  Item: (props: { children?: React.ReactNode; className?: string }) => JSX.Element;
  Compact: (props: SpaceCompactProps) => JSX.Element;
};

function SpaceItem({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={cn('flex-1 min-w-0', className)}>{children}</div>;
}
(Space as any).Item = SpaceItem;

// Space.Compact - a compact mode where items are joined together
interface SpaceCompactProps {
  block?: boolean;
  children?: React.ReactNode;
  className?: string;
}

function SpaceCompact({ block, children, className }: SpaceCompactProps) {
  return (
    <div className={cn('flex', block && 'w-full', className)} style={{ gap: 0 }}>
      {children}
    </div>
  );
}
(Space as any).Compact = SpaceCompact;

// ============================================================
// AntD-compatible Spin (loading spinner)
// ============================================================
interface SpinProps {
  size?: 'small' | 'default' | 'large';
  tip?: React.ReactNode;
  className?: string;
  spinning?: boolean;
  indicator?: React.ReactNode;
  children?: React.ReactNode;
}

function Spin({
  size = 'default',
  tip,
  className,
  spinning = true,
  indicator,
  children,
}: SpinProps) {
  const sizeMap = { small: '1rem', default: '1.5rem', large: '2rem' };
  const spinnerSize = sizeMap[size];

  if (!spinning) return <>{children}</>;

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      {indicator ?? (
        <span
          className="inline-block animate-spin"
          style={{ fontSize: spinnerSize, lineHeight: spinnerSize }}
        >
          ⟳
        </span>
      )}
      {tip && <span className="text-sm text-muted-foreground">{tip}</span>}
    </div>
  );
}

// ============================================================
// AntD-compatible Alert (wraps shadcn Alert)
// ============================================================
interface LegacyAlertProps {
  type?: 'success' | 'info' | 'warning' | 'error' | 'default';
  showIcon?: boolean;
  message?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  closeable?: boolean;
  onClose?: () => void;
}

const typeIconMap: Record<string, React.ReactNode> = {
  success: <span className="text-green-500">✓</span>,
  warning: <span className="text-yellow-500">⚠</span>,
  error: <span className="text-red-500">✕</span>,
  info: <span className="text-blue-500">ℹ</span>,
  default: <span className="text-muted-foreground">!</span>,
};

function LegacyAlert({
  type = 'default',
  showIcon,
  message,
  description,
  className,
  children,
}: LegacyAlertProps) {
  return (
    <div className={cn('flex flex-col gap-1 p-3 rounded-md border', className)}>
      <div className="flex items-start gap-2">
        {showIcon && <span className="mt-0.5">{typeIconMap[type]}</span>}
        <div className="flex flex-col gap-0.5">
          {message && <div className="text-sm font-medium">{message}</div>}
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AntD-compatible Button
// ============================================================
interface ButtonProps {
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  size?: 'small' | 'middle' | 'large';
  icon?: React.ReactNode;
  shape?: 'default' | 'circle' | 'round';
  block?: boolean;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  htmlType?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  style?: React.CSSProperties;
  danger?: boolean;
}

function Button({
  type = 'default',
  size = 'middle',
  icon,
  shape = 'default',
  block,
  className,
  children,
  disabled,
  loading,
  ...props
}: ButtonProps) {
  const sizeClass =
    size === 'small'
      ? 'h-8 px-3 text-xs'
      : size === 'large'
        ? 'h-11 px-6 text-base'
        : 'h-10 px-4 text-sm';
  const shapeClass =
    shape === 'circle'
      ? 'rounded-full px-0 w-10'
      : shape === 'round'
        ? 'rounded-full'
        : 'rounded-md';
  const typeClass =
    type === 'primary'
      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
      : type === 'dashed'
        ? 'border border-dashed border-input hover:bg-accent'
        : type === 'link'
          ? 'text-primary underline hover:no-underline'
          : type === 'text'
            ? 'hover:bg-accent'
            : 'bg-background border border-input hover:bg-accent';

  return (
    <button
      type={props.htmlType ?? 'button'}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        sizeClass,
        shapeClass,
        typeClass,
        block && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? <span className="animate-spin">⟳</span> : icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

// AntD-compatible Input (native input wrapper)
// ============================================================
interface LegacyInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'prefix'
> {
  size?: 'large' | 'small' | 'middle';
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const LegacyInput = React.forwardRef<HTMLInputElement, LegacyInputProps>(
  ({ size = 'middle', prefix, suffix, className, ...props }, ref) => {
    const sizeClass = size === 'large' ? 'h-11' : size === 'small' ? 'h-8' : 'h-10';
    return (
      <div
        className={cn(
          'flex items-center border border-input rounded-md bg-background px-3 py-1 focus-within:ring-2 focus-within:ring-ring',
          className
        )}
      >
        {prefix && <span className="mr-2 text-muted-foreground">{prefix}</span>}
        <input
          ref={ref}
          className={cn(
            'flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground',
            sizeClass
          )}
          {...props}
        />
        {suffix && <span className="ml-2 text-muted-foreground">{suffix}</span>}
      </div>
    );
  }
);
LegacyInput.displayName = 'LegacyInput';

// ============================================================
// AntD-compatible List
// ============================================================
interface ListGridSettings {
  gutter?: number;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  column?: number;
}

interface ListItemProps {
  children?: React.ReactNode;
  className?: string;
}

function ListItemWrapper({ children, className }: ListItemProps) {
  return <div className={cn('py-2 border-b last:border-b-0', className)}>{children}</div>;
}

interface ListWrapperProps<T = any> {
  size?: 'small' | 'middle' | 'large';
  className?: string;
  children?: React.ReactNode;
  grid?: ListGridSettings;
  dataSource?: T[];
  renderItem?: (item: T, index: number) => React.ReactNode;
  locale?: { emptyText?: React.ReactNode };
}

function ListWrapper({
  size: _size,
  className,
  children,
  grid,
  dataSource,
  renderItem,
  locale,
}: ListWrapperProps<any>) {
  // If dataSource and renderItem are provided, map over them
  if (dataSource && renderItem) {
    if (dataSource.length === 0) {
      return (
        <div className={cn('py-4 text-center text-sm text-muted-foreground', className)}>
          {locale?.emptyText ?? '暂无数据'}
        </div>
      );
    }
    const items = dataSource.map((item, index) => renderItem(item, index));

    // Apply grid layout if specified
    if (grid) {
      const colCount = grid.column ?? grid.md ?? 3;
      return (
        <div
          className={cn('grid gap-4', className)}
          style={{
            gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
          }}
        >
          {items}
        </div>
      );
    }

    return <div className={className}>{items}</div>;
  }

  return <ShadcnList className={className}>{children}</ShadcnList>;
}
(ListWrapper as unknown as any).Item = ListItemWrapper;
// ============================================================
// AntD-compatible Table
// ============================================================
interface TableColumn<T = Record<string, unknown>> {
  title?: React.ReactNode;
  dataIndex?: keyof T;
  key?: string;
  width?: number | string;
  render?: (value: T[keyof T], record: T, index: number) => React.ReactNode;
}

interface TableProps<T = Record<string, unknown>> {
  dataSource?: T[];
  columns?: TableColumn<T>[];
  rowKey?: string | ((record: T) => string);
  size?: 'small' | 'middle' | 'large';
  pagination?: boolean | object;
  className?: string;
  onChange?: (pagination: unknown, filters: Record<string, unknown>, sorter: unknown) => void;
}

function LegacyTable({
  dataSource = [],
  columns = [],
  rowKey,
  size = 'middle',
  className,
  ..._props
}: TableProps<Record<string, unknown>>) {
  const getRowKey = (record: Record<string, unknown>, index: number): string => {
    if (typeof rowKey === 'function')
      return (rowKey as (r: Record<string, unknown>) => string)(record);
    if (typeof rowKey === 'string') return String(record[rowKey] ?? index);
    return String(index);
  };

  const sizeClass = size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm';

  return (
    <div className={cn('relative w-full overflow-auto', className)}>
      <table className={cn('w-full caption-bottom', sizeClass)}>
        <thead>
          <tr className="border-b">
            {columns.map((col, i) => (
              <th
                key={col.key ?? i}
                style={{ width: col.width }}
                className="text-left font-medium p-2"
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataSource.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center p-4 text-muted-foreground">
                暂无数据
              </td>
            </tr>
          ) : (
            dataSource.map((record, rowIndex) => (
              <tr
                key={getRowKey(record, rowIndex)}
                className="border-b last:border-b-0 hover:bg-muted/50"
              >
                {columns.map((col, colIndex) => {
                  const value = col.dataIndex
                    ? (record as Record<string, unknown>)[col.dataIndex as string]
                    : undefined;
                  return (
                    <td key={col.key ?? colIndex} className="p-2">
                      {col.render
                        ? col.render(
                            value as string | number | Record<string, unknown>,
                            record as Record<string, unknown>,
                            rowIndex
                          )
                        : (value as React.ReactNode)}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// AntD-compatible Tag
// ============================================================
function LegacyTag({ children, color, ...props }: any) {
  return (
    <ShadcnTag color={color} {...props}>
      {children}
    </ShadcnTag>
  );
}

// ============================================================
// InputNumber component (native number input wrapper)
// ============================================================
interface InputNumberProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: 'large' | 'small' | 'middle';
  style?: React.CSSProperties;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  ({ value, defaultValue, onChange, min, max, step, size, style, className, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<number | undefined>(
      defaultValue ?? value
    );

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
          'flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
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
  style?: React.CSSProperties;
  orientation?: 'left' | 'right' | 'center';
  className?: string;
  children?: React.ReactNode;
}

function Divider({ orientation: _orientation = 'left', className, children }: DividerProps) {
  if (children) {
    return (
      <div className={cn('relative my-4', className)}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-2 text-xs text-muted-foreground">{children}</span>
        </div>
      </div>
    );
  }
  return <div className={cn('my-4 border-t border-border', className)} />;
}

// ============================================================
// Collapse (wraps existing Accordion)
// ============================================================
interface CollapseItem {
  key: string;
  label: React.ReactNode;
  children: React.ReactNode;
}

interface CollapseProps {
  activeKey?: string | string[];
  defaultActiveKey?: string | string[];
  onChange?: (key: string | string[]) => void;
  accordion?: boolean;
  className?: string;
  children?: React.ReactNode;
  items?: CollapseItem[];
  ghost?: boolean;
}

interface CollapsePanelProps {
  key?: string;
  header?: React.ReactNode;
  children?: React.ReactNode;
}

function CollapsePanel({ header: _header, children: _children }: CollapsePanelProps) {
  return null;
}

function CollapseBase({
  activeKey,
  defaultActiveKey,
  onChange,
  accordion,
  className,
  children,
  items,
  ghost,
}: CollapseProps) {
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
    onChange?.(
      newKeys.size === 0 ? ((Array.isArray(activeKey) ? [] : '') as any) : (result as any)
    );
  };

  // Parse children to extract panels OR use items prop
  const panels: { key: string; header: React.ReactNode; children: React.ReactNode }[] = [];
  if (items) {
    panels.push(
      ...items.map((item) => ({ key: item.key, header: item.label, children: item.children }))
    );
  } else {
    React.Children.forEach(children, (child) => {
      if (child && React.isValidElement(child) && child.props?.key) {
        panels.push({
          key: String(child.props.key),
          header: child.props.header,
          children: child.props.children,
        });
      }
    });
  }

  return (
    <div className={cn('flex flex-col rounded-md', ghost ? '' : 'border', className)}>
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
              <span className={cn('transition-transform', isOpen ? 'rotate-180' : '')}>▼</span>
            </button>
            {isOpen && <div className="px-4 pb-4 text-sm">{panel.children}</div>}
          </div>
        );
      })}
    </div>
  );
}
(CollapseBase as any).Panel = CollapsePanel;
const Collapse = CollapseBase as unknown as ((props: CollapseProps) => JSX.Element) & {
  Panel: (props: CollapsePanelProps) => JSX.Element;
};

// ============================================================
// AntD-compatible Dropdown (wraps DropdownMenu)
// ============================================================

export {
  Form,
  FormItem,
  LegacySelect as Select,
  RadioGroup,
  Radio,
  RadioButton,
  Modal,
  InputNumber,
  Divider,
  Row,
  Col,
  Collapse,
  CollapsePanel,
  AntdCard as Card,
  CardMeta,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Option,
  TextArea,
  Textarea,
  message,
  ColorPicker,
  Upload,
  AvatarDirect as Avatar,
  AvatarImage,
  AvatarFallback,
  ShadcnText as Text,
  ShadcnTitle as Title,
  ShadcnParagraph as Paragraph,
  useRhfForm as useForm,
  Button,
  LegacyInput as Input,
  ListWrapper as List,
  ListItem,
  LegacyTag as Tag,
  LegacyTable as Table,
  ShadcnEmpty as Empty,
  ShadcnProgress as Progress,
  Space,
  SpaceItem,
  Spin,
  LegacyAlert as Alert,
  Popconfirm,
  LegacyDropdown as Dropdown,
  type FormProps,
  type FormItemProps,
  type LegacySelectProps,
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
  type AvatarProps,
  type ButtonProps,
  type LegacyInputProps,
  type ListWrapperProps,
  type ListItemProps,
  type SpinProps,
  type LegacyAlertProps,
};
