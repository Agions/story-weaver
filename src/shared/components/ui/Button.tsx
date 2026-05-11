/**
 * 通用按钮组件
 * 统一按钮样式和行为
 */

import { Loader2 } from 'lucide-react';
import React from 'react';

import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/shared/utils/class-names';

interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

export const Button = ({
  variant = 'default',
  size = 'default',
  loading = false,
  disabled = false,
  block = false,
  icon,
  onClick,
  children,
  className,
  ...props
}: ButtonProps) => {
  return (
    <ShadcnButton
      variant={variant}
      size={size}
      disabled={disabled || loading}
      className={cn(block ? 'w-full' : '', className)}
      onClick={onClick}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {loading ? (
        <span className="animate-spin mr-2">
          <Loader2 className="h-4 w-4" />
        </span>
      ) : null}
      {children}
    </ShadcnButton>
  );
};

export default Button;
