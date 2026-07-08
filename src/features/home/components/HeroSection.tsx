import { Plus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/shared/components/ui/button';

import styles from './HeroSection.module.less';

/**
 * 首页英雄区域组件
 * 展示应用名称、主要功能和快捷操作
 */
const HeroSection = () => {
  const navigate = useNavigate();

  const handleCreateProject = () => {
    navigate('/project/new');
  };

  const handleEnterWorkspace = () => {
    navigate('/editor');
  };

  return (
    <div className={styles.hero}>
      {/* 背景装饰 */}
      <div className={styles.glow} />
      <div className={styles.grid} />

      <div className={styles.heroContent}>
        <div className={styles.badge}>
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI 驱动的漫剧创作平台</span>
        </div>

        <h1 className={styles.title}>
          Story Weaver
          <span className={styles.highlight}>AI</span>
        </h1>

        <p className={styles.subtitle}>
          从灵感到成片，一站式完成分镜生成、角色设计、
          <br className={styles.br} />
          语音合成与视频渲染
        </p>

        <div className={styles.heroButtons}>
          <Button
            size="lg"
            variant="gradient"
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
            继续上次项目
          </Button>
        </div>

        <p className={styles.hint}>免费使用 · 无需信用卡 · 60秒上手</p>
      </div>
    </div>
  );
};

export default HeroSection;
