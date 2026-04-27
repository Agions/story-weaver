import {
  Zap,
  Code,
  Cloud,
  Lightbulb,
  Rocket
} from 'lucide-react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useTheme } from '@/context/ThemeContext';

import styles from './Features.module.less';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const featureList: Feature[] = [
  {
    icon: <Zap className="h-6 w-6" />,
    title: '智能分析',
    description: '基于AI技术分析视频内容，智能识别关键场景和情感变化',
    color: '#6366f1'
  },
  {
    icon: <Code className="h-6 w-6" />,
    title: '脚本生成',
    description: '自动生成专业短视频脚本，支持多种风格和平台定制',
    color: '#ec4899'
  },
  {
    icon: <Cloud className="h-6 w-6" />,
    title: '一键剪辑',
    description: '根据脚本一键生成精美短视频，无需复杂操作',
    color: '#14b8a6'
  },
  {
    icon: <Lightbulb className="h-6 w-6" />,
    title: '创意辅助',
    description: 'AI提供创意建议和创作灵感，帮助提升内容质量',
    color: '#f59e0b'
  }
];

/**
 * 功能展示组件
 * 展示产品的核心功能特性
 */
const Features: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={styles.features}>
      <h3 className={styles.sectionTitle}>
        <Rocket className="inline-block h-5 w-5 mr-2" />
        强大功能
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {featureList.map((feature, index) => (
          <Card
            key={index}
            className={`${styles.featureCard} ${isDarkMode ? styles.darkCard : ''}`}
          >
            <CardContent>
              <div
                className={styles.featureIcon}
                style={{ color: feature.color }}
              >
                {feature.icon}
              </div>
              <h4 className={styles.featureTitle}>{feature.title}</h4>
              <p className={styles.featureDesc}>
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Features;
