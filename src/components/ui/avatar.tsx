"use client"

import { User } from 'lucide-react';
import * as React from "react"

import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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

export { AntDAvatar as Avatar, type AntDAvatarProps }
