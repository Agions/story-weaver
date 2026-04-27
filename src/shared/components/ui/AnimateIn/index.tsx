/**
 * AnimateIn - Simple fade-in animation wrapper
 * Uses the m-* motion classes from globals.css / index.less
 */
import React from 'react';

interface AnimateInProps {
  type?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'scale';
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

const AnimateIn: React.FC<AnimateInProps> = ({ 
  children, 
  delay = 0, 
  className = '', 
  type = 'fadeIn' 
}) => {
  const style: React.CSSProperties = {
    animationDelay: `${delay}ms`,
  };

  // Maps to m-* motion utility classes
  const animationClass = {
    fadeIn: 'm-fade-in',
    slideUp: 'm-slide-up-in',
    slideLeft: 'm-slide-left-in',
    scale: 'm-zoom-in',
  }[type];

  return (
    <div className={`${animationClass} ${className}`} style={style}>
      {children}
    </div>
  );
};

export default AnimateIn;
