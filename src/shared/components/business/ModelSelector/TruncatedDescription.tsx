import React from 'react';

interface TruncatedDescriptionProps {
  children: React.ReactNode;
  className?: string;
  lines?: number;
}

const baseStyle: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  fontSize: 14,
  color: 'rgba(0,0,0,0.65)',
  margin: '8px 0',
};

export function TruncatedDescription({
  children,
  className,
  lines = 2,
}: TruncatedDescriptionProps) {
  return (
    <p className={className} style={{ ...baseStyle, WebkitLineClamp: lines }}>
      {children}
    </p>
  );
}
