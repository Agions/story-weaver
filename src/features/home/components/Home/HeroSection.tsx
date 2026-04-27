import { Plus, Play } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import styles from './HeroSection.module.less';

/**
 * 首页英雄区域组件
 * 展示应用名称、主要功能和快捷操作
 */
const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateProject = () => {
    navigate('/project/new');
  };

  const handleEnterWorkspace = () => {
    navigate('/editor');
  };

  return (
    <div className={styles.hero}>
      <div className={styles.heroContent}>
        <h1 className={styles.title}>
          PlotCraft AI <span className={styles.highlight}>AI视频脚本创作</span>
        </h1>
        <p className={styles.subtitle}>
          AI赋能的短视频创作工具，让视频制作更简单、更高效
        </p>
        <div className={styles.heroButtons}>
          <Button
            size="lg"
            onClick={handleCreateProject}
            className={styles.primaryButton}
          >
            <Plus className="mr-2 h-4 w-4" />
            创建新项目
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleEnterWorkspace}
            className={styles.secondaryButton}
          >
            <Play className="mr-2 h-4 w-4" />
            进入工作台
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
