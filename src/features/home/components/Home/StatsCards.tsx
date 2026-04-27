import { Video, Star, Flame } from 'lucide-react';
import React from 'react';
import { Card } from '@/components/ui/card';

import { useTheme } from '@/context/ThemeContext';

import styles from './StatsCards.module.less';

interface Project {
  id: string;
  status: 'draft' | 'processing' | 'completed';
}

/**
 * 统计卡片组件
 * 展示项目数量、已完成、处理中统计
 */
interface StatsCardsProps {
  projects: Project[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ projects }) => {
  const { isDarkMode } = useTheme();

  const completedCount = projects.filter(p => p.status === 'completed').length;
  const processingCount = projects.filter(p => p.status === 'processing').length;

  const stats = [
    { title: '项目总数', value: projects.length, icon: Video, color: '#6366f1' },
    { title: '已完成项目', value: completedCount, icon: Star, color: '#22c55e' },
    { title: '处理中项目', value: processingCount, icon: Flame, color: '#f59e0b' },
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 ${styles.stats}`}>
      {stats.map((stat, index) => (
        <Card
          key={index}
          className={`${styles.statsCard} ${isDarkMode ? styles.darkCard : ''}`}
        >
          <div className="flex items-center gap-4">
            <stat.icon className="h-8 w-8" style={{ color: stat.color }} />
            <div>
              <p className="text-muted-foreground text-sm">{stat.title}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;