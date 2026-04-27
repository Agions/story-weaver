/**
 * GridStatistic - Grid display for statistics
 */
import React from 'react';

interface StatItem {
  label: string;
  value: string | number;
  color?: string;
}

interface GridStatisticProps {
  items: StatItem[];
  columns?: number;
}

const GridStatistic: React.FC<GridStatisticProps> = ({ items, columns = 4 }) => {
  const gridCols: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
  };

  return (
    <div className={`grid ${gridCols[columns] || 'grid-cols-4'} gap-4`}>
      {items.map((item, index) => (
        <div key={index} className="text-center p-4 rounded-lg bg-card">
          <div style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            color: item.color || 'var(--color-primary)',
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            {item.value}
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: 'var(--muted-foreground)', 
            marginTop: '4px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GridStatistic;