import { ArrowLeft, Save, FileText, AlertTriangle } from 'lucide-react';
import { Suspense, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useProject } from '@/core/hooks/useProject';
import CostDashboard from '@/shared/components/business/CostDashboard';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';

import { StepContentSwitcher } from './components/StepContentSwitcher';
import { StepNavigation } from './components/StepNavigation';
import { ProjectEditProvider } from './context/ProjectEditContext';
import { useProjectExport } from './hooks/useProjectExport';
import { useProjectLoader } from './hooks/useProjectLoader';
import styles from './ProjectEdit.module.less';

/**
 * 项目编辑页面
 * 支持创建新项目或编辑现有项目
 *
 * 状态管理策略:
 * - 页面级 state (name/description/focusFrameId) — 保留在本组件
 * - 步骤级 state — 由 ProjectEditProvider (Context) 管理
 * - 全局状态 (project/currentStep/saving) — 由 useProject hook 管理
 */
const ProjectEdit = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // 仅保留 Header 表单 state
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [initialLoading] = useState(false);

  const { project, error, currentStep, setCurrentStep } = useProject();

  const { exportPreset, exportSettings } = useProjectExport();

  // 初始化 - 加载项目数据（返回 {loading, error, data}）
  const { data: loaderData } = useProjectLoader(projectId);

  const handleBack = () => navigate(-1);

  // Provider 注入的元数据（handler 需要通过 projectMetadata 访问 name/description）
  const projectMetadata = useMemo(
    () => ({
      name,
      description,
      exportPreset,
      exportSettings,
    }),
    [name, description, exportPreset, exportSettings]
  );

  // --- 渲染 ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <h2 className="text-xl font-semibold">加载失败</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={handleBack}>
          返回
        </Button>
      </div>
    );
  }

  return (
    <ProjectEditProvider projectMetadata={projectMetadata} initialData={loaderData}>
      <div className={styles.container}>
        {initialLoading && (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">加载项目中...</p>
            </div>
          </div>
        )}

        {/* 顶部 Header */}
        <div className={styles.header}>
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
          <h3 style={{ margin: 0 }}>{project ? '编辑项目' : '创建新项目'}</h3>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <FileText className="h-4 w-4 mr-1" />
              导出评审记录
            </Button>
            <Button variant="default" disabled>
              <Save className="h-4 w-4 mr-1" />
              保存项目
            </Button>
          </div>
        </div>

        {/* 项目基本信息 */}
        <Card className={styles.card}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">项目名称</label>
              <Input
                placeholder="请输入项目名称"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">项目描述</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="请输入项目描述（选填）"
                maxLength={500}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* 成本面板 */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <CostDashboard projectId={project?.id} />
        </Suspense>

        {/* 步骤导航 */}
        <StepNavigation currentStep={currentStep} onStepChange={setCurrentStep} projectId={project?.id} />

        {/* 步骤内容 */}
        <div className={styles.stepsContent}>
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <StepContentSwitcher currentStep={currentStep} />
          </Suspense>
        </div>
      </div>
    </ProjectEditProvider>
  );
};

export default ProjectEdit;
