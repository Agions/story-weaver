import { Plus } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useTheme } from '@/context/ThemeContext';

import styles from './CTASection.module.less';

/**
 * CTA (Call to Action) 组件
 * 引导用户创建项目
 */
const CTASection: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const handleCreateProject = () => {
    navigate('/project/new');
  };

  return (
    <Card
      className={`${styles.cta} ${isDarkMode ? styles.darkCta : ''}`}
      borderless
    >
      <CardHeader>
        <CardTitle>准备好开始创作了吗？</CardTitle>
      </CardHeader>
      <CardContent className={styles.ctaText}>
        <p>使用PlotCraft AI，让AI为您的创作提供灵感和效率</p>
      </CardContent>
      <Button
        size="lg"
        onClick={handleCreateProject}
        className={styles.ctaButton}
      >
        <Plus className="mr-2 h-4 w-4" />
        立即创建项目
      </Button>
    </Card>
  );
};

export default CTASection;
