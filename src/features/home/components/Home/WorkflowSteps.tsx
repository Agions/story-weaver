import {
  Video,
  Zap,
  FileText,
  Scissors
} from 'lucide-react';
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { useTheme } from '@/context/ThemeContext';

import styles from './WorkflowSteps.module.less';

interface Step {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: <Video className="h-6 w-6" />,
    title: '上传视频',
    description: '上传您的原始视频素材'
  },
  {
    number: 2,
    icon: <Zap className="h-6 w-6" />,
    title: 'AI分析',
    description: '智能分析视频内容和结构'
  },
  {
    number: 3,
    icon: <FileText className="h-6 w-6" />,
    title: '自动生成脚本',
    description: '基于分析生成专业短视频脚本'
  },
  {
    number: 4,
    icon: <Scissors className="h-6 w-6" />,
    title: '智能剪辑',
    description: '一键生成精美短视频成品'
  }
];

/**
 * 工作流程步骤组件
 * 展示产品使用流程
 */
const WorkflowSteps: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={styles.workflow}>
      <h3 className={styles.sectionTitle}>
        <Zap className="inline-block h-5 w-5 mr-2" />
        使用流程
      </h3>
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 ${styles.steps}`}>
        {steps.map((step, index) => (
          <Card
            key={index}
            className={`${styles.stepCard} ${isDarkMode ? styles.darkCard : ''}`}
          >
            <CardContent className="text-center">
              <div className={styles.stepNumber}>{step.number}</div>
              <div className={styles.stepIcon}>{step.icon}</div>
              <h4 className="mb-2">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WorkflowSteps;