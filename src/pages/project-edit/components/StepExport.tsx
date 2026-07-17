/**
 * Step 8: 视频导出
 *
 * 通过 useStepExportContext() 获取 exportPreset/exportSettings/qualityGate 等，
 * 通过 secureStorage 读取断点信息。
 * 不再依赖父组件层层传递 props。
 */
import { Download, RotateCcw, Trash2, Send } from 'lucide-react';
import { lazy, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useProject } from '@/core/hooks/useProject';
import { secureStorage } from '@/core/services/project/secure-storage-service';
import { assetLibraryService } from '@/features/asset-library';
import { videoExportService } from '@/features/video-export';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { toast } from '@/shared/components/ui/toast';

import { useStepExportContext } from '../context/selectors';
import styles from '../ProjectEdit.module.less';

import QualityGateAlert from './QualityGateAlert';

const VideoExporter = lazy(() => import('@/components/media/video/VideoExporter'));

/** Pipeline step IDs that support checkpoint resume */
const CHECKPOINTABLE_STEPS = [
  'step-import',
  'step-analysis',
  'step-script',
  'step-storyboard',
  'step-character',
  'step-render',
  'step-video-editing',
  'step-export',
] as const;

type CheckpointStepId = typeof CHECKPOINTABLE_STEPS[number];

interface CheckpointInfo {
  stepId: CheckpointStepId;
  completed: boolean;
  timestamp: number;
}

/** 支持的发布平台 */
type PublishPlatform = 'youtube' | 'bilibili' | 'douyin' | 'kuaishou';

const PLATFORM_LABELS: Record<PublishPlatform, string> = {
  youtube: 'YouTube',
  bilibili: '哔哩哔哩',
  douyin: '抖音',
  kuaishou: '快手',
};

function StepExport() {
  const {
    exportPreset,
    exportSettings,
    framesCount,
    qualityGateIssues,
    qualityGatePassed,
    onPresetChange,
    onExportSettingsChange,
    onSaveProject,
    onLocateIssue,
  } = useStepExportContext();
  const { projectId } = useParams();
  const { project } = useProject();
  const { setCurrentStep } = useProject();

  // Checkpoint state
  const [checkpoints, setCheckpoints] = useState<CheckpointInfo[]>([]);

  // 发布状态
  const [selectedPlatforms, setSelectedPlatforms] = useState<PublishPlatform[]>(['bilibili']);
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<
    Array<{ platform: string; success: boolean; url?: string; error?: string }>
  >([]);

  // 从 feature 切片获取预设名称和资产库统计
  const exportPresets = videoExportService.listExportPresets();
  const getPresetName = (aspectRatio: string): string => {
    const preset = exportPresets.find((p) => p.aspectRatio === aspectRatio);
    return preset?.name ?? aspectRatio;
  };

  // 资产库统计（用于展示复用率）
  const assetStats = assetLibraryService.getAssetLibraryStats();
  const highReuseTemplates = assetLibraryService.getHighReuseTemplates();

  // 加载 checkpoint 状态
  useEffect(() => {
    if (!projectId) return;
    Promise.all(
      CHECKPOINTABLE_STEPS.map(async (stepId) => {
        const cp = await secureStorage.loadCheckpoint(stepId);
        return cp ? { stepId, completed: cp.completed, timestamp: cp.timestamp } as CheckpointInfo : null;
      })
    ).then((results) => {
      setCheckpoints(results.filter((r): r is CheckpointInfo => r !== null));
    });
  }, [projectId]);

  // 清除所有 checkpoint
  const handleClearCheckpoints = async () => {
    await secureStorage.clearAllCheckpoints();
    setCheckpoints([]);
    toast.success('已清除所有断点');
  };

  // 恢复到最后完成步骤
  const handleResumeFromCheckpoint = () => {
    if (checkpoints.length === 0) return;
    const lastCompleted = [...checkpoints].sort((a, b) => b.timestamp - a.timestamp)[0];
    const stepIndex = CHECKPOINTABLE_STEPS.indexOf(lastCompleted.stepId as typeof CHECKPOINTABLE_STEPS[number]);
    if (stepIndex >= 0 && stepIndex < CHECKPOINTABLE_STEPS.length - 1) {
      setCurrentStep(stepIndex + 1);
      toast.success(`已恢复到步骤 ${stepIndex + 1}，将从断点继续执行`);
    }
  };

  const lastCheckpoint = checkpoints.length > 0
    ? [...checkpoints].sort((a, b) => b.timestamp - a.timestamp)[0]
    : null;

  // 发布处理
  const handlePublish = async () => {
    if (!qualityGatePassed) {
      toast.error('质量闸门未通过，已阻止发布。请先修复阻断项。');
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error('请选择至少一个发布平台');
      return;
    }
    setPublishing(true);
    setPublishResults([]);
    try {
      const videoUrl = project?.videos?.[0]?.path || `https://example.com/videos/${projectId}.mp4`;
      const results = await videoExportService.publishToMultiplePlatforms({
        platforms: selectedPlatforms,
        videoUrl,
        title: project?.name || '未命名视频',
        description: `由 Story Weaver 生成的视频作品`,
      });
      setPublishResults(results);
      const successCount = results.filter((r) => r.success).length;
      if (successCount === results.length) {
        toast.success(`成功发布到 ${successCount} 个平台`);
      } else if (successCount > 0) {
        toast.warning(`成功发布到 ${successCount} 个平台，${results.length - successCount} 个失败`);
      } else {
        toast.error('所有平台发布均失败，请稍后重试');
      }
    } catch {
      toast.error('发布过程中发生错误');
    } finally {
      setPublishing(false);
    }
  };

  const togglePlatform = (platform: PublishPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  return (
    <Card className={styles.stepCard}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          视频导出
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">导出最终视频脚本视频。</p>

        {/* Checkpoint 恢复面板 */}
        {lastCheckpoint && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  检测到执行断点
                </h4>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  最后完成步骤: {lastCheckpoint.stepId} ({new Date(lastCheckpoint.timestamp).toLocaleString()})
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  已完成 {checkpoints.filter((c) => c.completed).length} / {CHECKPOINTABLE_STEPS.length} 个步骤
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="default" size="sm" onClick={handleResumeFromCheckpoint}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  恢复执行
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearCheckpoints}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 导出预设 */}
        <div className={styles.exportPresetBar}>
          <div className="flex gap-2">
            <Button
              variant={exportPreset === '9:16' ? 'default' : 'outline'}
              onClick={() => onPresetChange('9:16')}
            >
              {getPresetName('9:16')}
            </Button>
            <Button
              variant={exportPreset === '16:9' ? 'default' : 'outline'}
              onClick={() => onPresetChange('16:9')}
            >
              {getPresetName('16:9')}
            </Button>
            <Button
              variant={exportPreset === '1:1' ? 'default' : 'outline'}
              onClick={() => onPresetChange('1:1')}
            >
              {getPresetName('1:1')}
            </Button>
          </div>
        </div>

        {/* 资产库统计 */}
        {assetStats.totalAssets > 0 && (
          <div className="mb-4 p-3 bg-muted/50 rounded-md">
            <h4 className="text-sm font-medium mb-2">资产库统计</h4>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">模板</span>
                <p className="font-medium">{assetStats.totalTemplates}</p>
              </div>
              <div>
                <span className="text-muted-foreground">资产</span>
                <p className="font-medium">{assetStats.totalAssets}</p>
              </div>
              <div>
                <span className="text-muted-foreground">复用次数</span>
                <p className="font-medium">{assetStats.totalReuses}</p>
              </div>
              <div>
                <span className="text-muted-foreground">平均复用率</span>
                <p className="font-medium">{assetStats.averageReuseRate}%</p>
              </div>
            </div>
            {highReuseTemplates.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">
                  高复用模板：{highReuseTemplates.map((t) => t.name).join('、')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 导出器 */}
        <div className={styles.exporterContainer}>
          <QualityGateAlert
            issues={qualityGateIssues}
            passed={qualityGatePassed}
            onLocateIssue={onLocateIssue}
          />
          <VideoExporter
            projectId={projectId}
            projectName={project?.name}
            estimatedDuration={Math.max(framesCount * 5, 60)}
            initialSettings={exportSettings}
            onExport={async (settings) => {
              if (!qualityGatePassed) {
                toast.error('质量闸门未通过，已阻止导出。请先修复阻断项。');
                return;
              }
              onExportSettingsChange(settings);
              toast.success(`已按 ${exportPreset} 预设完成导出任务`);
            }}
          />
        </div>

        {/* 发布区域 */}
        <div className="mt-4 p-3 border border-dashed rounded-md">
          <h4 className="text-sm font-medium mb-2">发布</h4>
          <p className="text-xs text-muted-foreground mb-2">
            选择平台并发布成品视频。
          </p>
          <div className="flex flex-wrap gap-2 mb-2">
            {(Object.keys(PLATFORM_LABELS) as PublishPlatform[]).map((platform) => (
              <Button
                key={platform}
                variant={selectedPlatforms.includes(platform) ? 'default' : 'outline'}
                size="sm"
                onClick={() => togglePlatform(platform)}
              >
                {PLATFORM_LABELS[platform]}
              </Button>
            ))}
          </div>
          {publishResults.length > 0 && (
            <div className="mt-2 space-y-1">
              {publishResults.map((result, i) => (
                <p key={i} className={`text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                  {PLATFORM_LABELS[result.platform as PublishPlatform] || result.platform}:
                  {result.success ? ` 发布成功 (${result.url})` : ` 失败: ${result.error}`}
                </p>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={handlePublish} disabled={publishing}>
              <Send className="h-3 w-3 mr-1" />
              {publishing ? '发布中...' : '一键发布'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onSaveProject}>
              仅保存项目
            </Button>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className={styles.stepActions}>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentStep(7)}>
              上一步
            </Button>
            <Button variant="default" onClick={onSaveProject}>
              保存项目
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StepExport;
