import { Separator } from '@/shared/components/ui/separator';
import { useProjectStore } from '@/shared/stores/project.store';

import styles from './Home.module.less';

import { HeroSection, StatsCards, ProjectGrid, Features, WorkflowSteps, CTASection } from '.';

/**
 * 首页视图组件
 * 使用真实项目数据
 */
const HomeView = () => {
  const { recentProjects } = useProjectStore();

  // 处理项目删除后的刷新
  const handleProjectRefresh = () => {
    // 项目数据来自 store，自动同步
  };

  const projects = recentProjects();

  return (
    <div className={styles.container}>
      {/* 欢迎区 */}
      <HeroSection />

      {/* 统计信息 */}
      <StatsCards projects={projects} />

      {/* 项目列表 */}
      <ProjectGrid projects={projects} loading={false} onRefresh={handleProjectRefresh} />

      {/* 特性展示 */}
      <Features />

      {/* 工作流程 */}
      <WorkflowSteps />

      {/* 行动召唤区 */}
      <CTASection />

      {/* 页脚 */}
      <div className={styles.footer}>
        <Separator />
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <span className="text-muted-foreground text-sm">© 2026 frame-fab AI</span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-muted-foreground text-sm">基于 Tauri 和 React 构建</span>
          <Separator orientation="vertical" className="h-4" />
          <a
            href="https://github.com/agions/frame-fab"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground text-sm hover:underline hover:text-[#6366f1]"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
