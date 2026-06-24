/**
 * ProjectDetail 页面 - Presenter 层
 * 项目详情/管理页面，包含小说/剧本/分镜/角色/渲染/合成/配音/成本/导出等功能
 */
import {
  ArrowLeft,
  DollarSign,
  Download,
  Edit,
  FileText,
  Image,
  PlayCircle,
  Plus,
  Trash2,
  User,
  Volume2,
  Zap,
} from 'lucide-react';
import React, { Suspense, lazy, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { AudioEditorPanel } from '@/features/audio/components/AudioEditorPanel';
import { CostPanel } from '@/features/cost/components/CostPanel';
import { ExportPanel } from '@/features/export/components/ExportPanel';
import { StoryboardCollaborationPanel } from '@/features/storyboard';
import type { StoryboardFrame } from '@/features/storyboard/components/StoryboardEditor';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import Empty from '@/shared/components/ui/empty';
import { Modal } from '@/shared/components/ui/modal';
import { Space } from '@/shared/components/ui/space';
import { Spin } from '@/shared/components/ui/spin';
import { Tabs, TabPane } from '@/shared/components/ui/tabs';
import { Title, Text, Paragraph } from '@/shared/components/ui/typography';

import { useProjectDetail } from './hooks/useProjectDetail';
import styles from './ProjectDetail.module.less';

/**
 * EmptyScriptHint — inline component for "script not generated" empty state.
 * Extracted from ProjectDetailPage (was duplicated 4 times across script/character/
 * render/audio/export tabs + 1 variant for composition tab).
 */
const EmptyScriptHint: React.FC<{
  onEdit: () => void;
  description?: string;
  buttonText?: string;
}> = ({ onEdit, description = '请先生成或编辑剧本', buttonText = '去编辑剧本' }) => (
  <Empty description={description} image={undefined}>
    <Button type="primary" onClick={onEdit} icon={<Edit />}>
      {buttonText}
    </Button>
  </Empty>
);

// Lazy-loaded sub-components
const importScriptEditor = () => import('@/features/script/components/ScriptEditor');
const importRenderCenter = () => import('@/shared/components/business/RenderCenter');
const importCharacterDesigner = () => import('@/features/character/components/CharacterDesigner');
const importCompositionStudio = () => import('@/shared/components/business/CompositionStudio');
const importAudioEditor = () => import('@/features/audio/components/AudioEditor');
const importCostDashboard = () => import('@/shared/components/business/CostDashboard');

const ScriptEditor = lazy(importScriptEditor);
const RenderCenter = lazy(importRenderCenter);
const CharacterDesigner = lazy(importCharacterDesigner);
const CompositionStudio = lazy(importCompositionStudio);

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    loading,
    project,
    activeScript,
    activeTab,
    novelMetadata,
    selectedFrameId,
    storyboardFrames,
    exportQualityGate,
    setActiveTab,
    setActiveScript,
    persistProjectPatch,
    handleApplyRenderedFrame,
    handleExportReviewNotes,
    handleCreateScript,
    handleScriptChange,
    handleExportScript,
    preloadTabModules,
  } = useProjectDetail({ projectId: id ?? '' });

  // Preload mapping (must stay in presenter for lazy import references)
  const preloadByTab = useMemo<Record<string, Array<() => Promise<unknown>>>>(
    () => ({
      novel: [importScriptEditor],
      'script-edit': [importCharacterDesigner, importRenderCenter],
      storyboard: [importRenderCenter, importCompositionStudio],
      character: [importRenderCenter, importCompositionStudio],
      render: [importCompositionStudio, importAudioEditor],
      composition: [importAudioEditor, importCostDashboard],
      audio: [importCostDashboard],
      cost: [],
      export: [],
    }),
    []
  );

  // Preload on tab change
  useEffect(() => {
    const tasks = preloadByTab[activeTab] || [];
    if (tasks.length === 0) return;

    const warmup = () => {
      tasks.forEach((task) => void task());
    };
    // Use requestIdleCallback via runWhenIdle equivalent
    const timerId = setTimeout(warmup, 120);
    return () => clearTimeout(timerId);
  }, [activeTab, preloadByTab]);

  // Tab label renderer with preload trigger
  const renderTabLabel = (tabKey: string, icon: React.ReactNode, label: string) => (
    <span onMouseEnter={() => preloadTabModules(tabKey)} onFocus={() => preloadTabModules(tabKey)}>
      {icon}
      {label}
    </span>
  );

  // Navigation helpers (not in hook to avoid circular dependency)
  const handleGenerateScript = () => navigate(`/projects/${id}/edit`);
  const handleDeleteProject = async () => {
    if (!project || !id) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '确认删除',
        content: '确定要删除此项目吗？此操作不可撤销。',
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
      });
    });

    if (!confirmed) return;

    void handleDeleteProject();
    const { toast } = await import('@/shared/components/ui/toast');
    toast.success('项目已删除');
    navigate('/projects');
  };

  if (loading) {
    return <Spin size="large" tip="加载中..." />;
  }

  if (!project) {
    return <div>项目不存在</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Space>
          <Button icon={<ArrowLeft />} onClick={() => navigate('/projects')}>
            返回项目列表
          </Button>

          <Button icon={<Edit />} onClick={() => navigate(`/projects/${id}/edit`)}>
            编辑项目
          </Button>

          <Button
            icon={<Download />}
            onClick={handleExportScript}
            disabled={!activeScript?.content || activeScript.content.length === 0}
          >
            导出剧本
          </Button>

          <Button icon={<FileText />} onClick={handleExportReviewNotes} disabled={!project}>
            导出评审记录
          </Button>

          <Button danger icon={<Trash2 />} onClick={handleDeleteProject}>
            删除项目
          </Button>
        </Space>

        <Title level={2}>{project.name}</Title>
      </div>

      {project.description && (
        <Card className={styles.descriptionCard}>
          <Text>{project.description}</Text>
        </Card>
      )}

      <Card className={styles.functionCard}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          <TabPane tab={renderTabLabel('novel', <FileText />, '小说')} key="novel">
            <div className={styles.novelSection}>
              {project.content ? (
                <>
                  <Title level={5}>已导入的小说/剧本</Title>
                  {novelMetadata && (
                    <div className={styles.metadata}>
                      <p>
                        <strong>文件名:</strong> {novelMetadata.filename}
                      </p>
                      <p>
                        <strong>字符数:</strong> {novelMetadata.charCount.toLocaleString()}
                      </p>
                      <p>
                        <strong>预估章节数:</strong> {novelMetadata.estimatedChapters}
                      </p>
                    </div>
                  )}
                  <Paragraph>
                    <Text type="secondary">内容预览（前1000字符）:</Text>
                  </Paragraph>
                  <Card size="small" style={{ maxHeight: 200, overflow: 'auto' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      {project.content.substring(0, 1000)}
                      {project.content.length > 1000 ? '...' : ''}
                    </pre>
                  </Card>
                  <Button
                    type="link"
                    onClick={() => navigate(`/projects/${id}/edit`)}
                    icon={<Edit />}
                    style={{ marginTop: 16 }}
                  >
                    编辑项目内容
                  </Button>
                </>
              ) : (
                <Empty description="尚未导入小说/剧本内容" image={undefined}>
                  <Button
                    type="primary"
                    onClick={() => navigate(`/projects/${id}/edit`)}
                    icon={<Plus />}
                  >
                    导入小说/剧本
                  </Button>
                </Empty>
              )}
            </div>
          </TabPane>

          <TabPane tab={renderTabLabel('script-edit', <Edit />, '剧本')} key="script-edit">
            <div className={styles.scriptSection}>
              <div className={styles.scriptHeader}>
                <Title level={4}>剧本编辑</Title>
                <Space>
                  <Button type="primary" icon={<Edit />} onClick={handleGenerateScript}>
                    编辑剧本
                  </Button>

                  <Button icon={<Plus />} onClick={handleCreateScript}>
                    创建空白剧本
                  </Button>
                </Space>
              </div>

              {project.scripts && project.scripts.length > 0 ? (
                <>
                  <Tabs
                    activeKey={activeScript?.id}
                    onChange={(key) => {
                      const script = (project.scripts ?? []).find((s) => s.id === key);
                      if (script) setActiveScript(script);
                    }}
                  >
                    {project.scripts.map((script) => (
                      <TabPane
                        key={script.id}
                        tab={`剧本 ${new Date(script.createdAt).toLocaleDateString()}`}
                      >
                        <Suspense fallback={<Spin />}>
                          <ScriptEditor
                            segments={
                              script.segments
                                ? script.segments.map((seg) => ({
                                    id: seg.id,
                                    start: seg.startTime,
                                    end: seg.endTime,
                                    type: seg.type,
                                    content: seg.content,
                                  }))
                                : []
                            }
                            onSegmentsChange={handleScriptChange}
                          />
                        </Suspense>
                      </TabPane>
                    ))}
                  </Tabs>
                </>
              ) : (
                <Card>
                  <div className={styles.emptyScript}>
                    <Text type="secondary">
                      暂无剧本，点击&quot;编辑剧本&quot;或&quot;创建空白剧本&quot;按钮添加
                    </Text>
                  </div>
                </Card>
              )}
            </div>
          </TabPane>

          <TabPane tab={renderTabLabel('storyboard', <Image />, '分镜')} key="storyboard">
            <div className={styles.workflowSection}>
              {activeScript?.content && activeScript.content.length > 0 ? (
                <div className={styles.storyboardDetail}>
                  {storyboardFrames.length > 0 ? (
                    <StoryboardCollaborationPanel
                      projectId={project?.id ?? ''}
                      storyboardFrames={storyboardFrames}
                      selectedFrameId={selectedFrameId}
                      onSelectFrame={(id) => id}
                      onPersistPatch={persistProjectPatch}
                      onFrameUpdate={(frames) => persistProjectPatch({ storyboardFrames: frames })}
                    />
                  ) : (
                    <Empty description="暂无分镜，请先在编辑页生成分镜" image={undefined}>
                      <Button
                        type="primary"
                        onClick={() => navigate(`/projects/${id}/edit`)}
                        icon={<Edit />}
                      >
                        去生成分镜
                      </Button>
                    </Empty>
                  )}
                </div>
              ) : (
                <EmptyScriptHint onEdit={() => navigate(`/projects/${id}/edit`)} />
              )}
            </div>
          </TabPane>

          <TabPane tab={renderTabLabel('character', <User />, '角色')} key="character">
            <div className={styles.workflowSection}>
              {activeScript?.content && activeScript.content.length > 0 ? (
                <Suspense fallback={<Spin />}>
                  <CharacterDesigner
                    characters={project.characters ?? []}
                    onChange={(chars) => {
                      persistProjectPatch({ characters: chars });
                    }}
                    projectId={project?.id}
                  />
                </Suspense>
              ) : (
                <EmptyScriptHint onEdit={() => navigate(`/projects/${id}/edit`)} />
              )}
            </div>
          </TabPane>

          <TabPane tab={renderTabLabel('render', <Zap />, '渲染')} key="render">
            <div className={styles.workflowSection}>
              {activeScript?.content && activeScript.content.length > 0 ? (
                <Suspense fallback={<Spin />}>
                  <RenderCenter
                    frames={Array.isArray(project.storyboardFrames) ? project.storyboardFrames : []}
                    projectId={project?.id}
                    onApplyRenderedFrame={handleApplyRenderedFrame}
                  />
                </Suspense>
              ) : (
                <EmptyScriptHint onEdit={() => navigate(`/projects/${id}/edit`)} />
              )}
            </div>
          </TabPane>

          <TabPane tab={renderTabLabel('composition', <PlayCircle />, '合成')} key="composition">
            <div className={styles.workflowSection}>
              {activeScript?.segments &&
              activeScript.segments.length > 0 &&
              (project.storyboardFrames?.length ?? 0) > 0 ? (
                <Suspense fallback={<Spin />}>
                  <CompositionStudio
                    frames={project.storyboardFrames as StoryboardFrame[]}
                    projectId={project?.id}
                    onCompositionChange={(comp) => {
                      persistProjectPatch({ composition: comp });
                    }}
                  />
                </Suspense>
              ) : (
                <EmptyScriptHint
                  description="请先生成或编辑剧本并完成场景渲染"
                  buttonText="去编辑"
                  onEdit={() => navigate(`/projects/${id}/edit`)}
                />
              )}
            </div>
          </TabPane>

          <TabPane tab={renderTabLabel('audio', <Volume2 />, '配音')} key="audio">
            <div className={styles.workflowSection}>
              {activeScript?.content && activeScript.content.length > 0 ? (
                <AudioEditorPanel project={project} onPersistPatch={persistProjectPatch} />
              ) : (
                <EmptyScriptHint onEdit={() => navigate(`/projects/${id}/edit`)} />
              )}
            </div>
          </TabPane>

          <TabPane tab={renderTabLabel('cost', <DollarSign />, '成本')} key="cost">
            <div className={styles.workflowSection}>
              <CostPanel projectId={project?.id} onExportReviewNotes={handleExportReviewNotes} />
            </div>
          </TabPane>

          <TabPane tab={renderTabLabel('export', <Download />, '导出')} key="export">
            <div className={styles.workflowSection}>
              {activeScript?.content && activeScript.content.length > 0 ? (
                <ExportPanel
                  projectId={project?.id ?? ''}
                  qualityGate={exportQualityGate}
                  onNavigateToEdit={() => navigate(`/projects/${id}/edit`)}
                />
              ) : (
                <EmptyScriptHint onEdit={() => navigate(`/projects/${id}/edit`)} />
              )}
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ProjectDetail;
