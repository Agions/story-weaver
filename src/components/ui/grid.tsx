"use client"

import * as React from "react"
import { cn } from "@/shared/utils/class-names"

// ============================================================
// Row and Col components (flex grid wrappers)
// ============================================================
interface RowProps {
  gutter?: number | [number, number];
  align?: 'top' | 'middle' | 'bottom' | 'stretch';
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const Row: React.FC<RowProps> = ({ gutter, align, justify, className, style, children }) => {
  const [gx, gy = 0] = Array.isArray(gutter) ? gutter : [gutter ?? 0, 0];
  return (
    <div
      className={cn("flex flex-wrap", className)}
      style={{
        gap: gy ? `${gy}px ${gx}px` : `${gx}px`,
        alignItems: align === 'top' ? 'flex-start' : align === 'middle' ? 'center' : align === 'bottom' ? 'flex-end' : 'stretch',
        justifyContent: justify === 'start' ? 'flex-start' : justify === 'end' ? 'flex-end' : justify === 'center' ? 'center' : justify === 'space-around' ? 'space-around' : justify === 'space-between' ? 'space-between' : 'flex-start',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

interface ColProps {
  span?: number;
  offset?: number;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
  className?: string;
  children?: React.ReactNode;
}

const Col: React.FC<ColProps> = ({ span = 24, offset, xs, sm, md, lg, xl, xxl, className, children }) => {
  // Responsive breakpoints: xs < 576, sm >= 576, md >= 768, lg >= 992, xl >= 1200, xxl >= 1400
  // Use largest matching breakpoint if set
  let spanVal = span;
  const bpList: Array<[string, number | undefined]> = [['xxl', xxl], ['xl', xl], ['lg', lg], ['md', md], ['sm', sm], ['xs', xs]];
  for (const [, val] of bpList) {
    if (val !== undefined) { spanVal = val; break; }
  }

  return (
    <div
      className={cn("flex", className)}
      style={{
        flex: `0 0 ${(spanVal / 24) * 100}%`,
        maxWidth: `${(spanVal / 24) * 100}%`,
        marginLeft: offset ? `${(offset / 24) * 100}%` : undefined,
      }}
    >
      {children}
    </div>
  );
};

export { Row, Col, type RowProps, type ColProps }
