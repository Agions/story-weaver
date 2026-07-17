/**
 * Step 1: AI 解析内容
 *
 * 通过 useStepAnalysisContext() 获取所需的 state + actions，
 * 不再依赖父组件层层传递 props。
 *
 * 改进：使用 StepLayout + pipeline 组件替代手写的 Card shell；
 * 结构化解析结果使用 GenerationResult 包装。
 */
import { Edit } from 'lucide-react';
import { lazy } from 'react';

import StepLayout from '@/components/common/StepLayout/StepLayout';
import { GenerationResult } from '@/components/pipeline/GenerationResult';
import { StepActions } from '@/components/pipeline/StepActions';
import { useProject } from '@/core/hooks/useProject';
import { Alert } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { TextArea } from '@/shared/components/ui/textarea';

import { useStepAnalysisContext } from '../context/selectors';

const NovelImporter = lazy(() => import('@/components/ai/NovelImporter/NovelImporter'));

export interface StepAnalysisProps {
  content?: string;
  novelMetadata?: import('@/components/ai').ScriptImportMetadata | null;
  analysisDraft?: string;
  analysisState?: 'idle' | 'generated' | 'accepted';
  loading?: boolean;
  onContentLoad?: (
    newContent: string,
    metadata: import('@/components/ai').ScriptImportMetadata
  ) => void;
  onRemove?: () => void;
  onAnalyze?: () => void;
  onAccept?: () => void;
  onDraftChange?: (v: string) => void;
  onPrev?: () => void;
}

function StepAnalysis() {
  const {
    content,
    novelMetadata,
    analysisDraft,
    analysisState,
    loading,
    onContentLoad,
    onRemove,
    onAnalyze,
    onAccept,
    onDraftChange,
  } = useStepAnalysisContext();
  const { setCurrentStep } = useProject();

  const generationStatus = loading ? 'generating' : analysisState === 'idle' ? 'idle' : 'done';

  return (
    <StepLayout
      icon={<Edit className="h-5 w-5" />}
      title="AI解析内容"
      description="使用AI智能分析小说/剧本内容，提取关键信息，生成适合视频脚本展示的剧本。"
      showActions={false}
    >
      <NovelImporter
        initialContent={content}
        onContentLoad={onContentLoad}
        onRemove={onRemove}
        loading={false}
      />

      {novelMetadata && (
        <div className="mt-4">
          <h4 className="mb-2 font-semibold">内容信息</h4>
          <p className="text-sm">文件名: {novelMetadata.filename}</p>
          <p className="text-sm">字符数: {novelMetadata.charCount.toLocaleString()}</p>
          <p className="text-sm">章节数: {novelMetadata.chapterCount}</p>
          <p className="text-sm">预估章节数: {novelMetadata.estimatedChapters}</p>
        </div>
      )}

      {analysisState !== 'idle' && (
        <div className="mt-4">
          <GenerationResult
            title="结构化解析结果（可编辑）"
            status={generationStatus as 'idle' | 'generating' | 'done' | 'error'}
            extra={
              <Button variant="outline" onClick={onAnalyze} disabled={loading} size="sm">
                重新解析
              </Button>
            }
          >
            {analysisState === 'accepted' && (
              <Alert variant="default" className="mb-3 border-green-200 bg-green-50">
                当前解析结果已接受，可重跑覆盖
              </Alert>
            )}
            <TextArea
              value={analysisDraft}
              rows={14}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder="AI 解析 JSON 结果"
            />
          </GenerationResult>
        </div>
      )}

      <StepActions
        onPrev={() => setCurrentStep(0)}
        onNext={() =>
          analysisState === 'generated' || analysisState === 'accepted' ? onAccept() : onAnalyze()
        }
        nextLabel={
          analysisState === 'generated' || analysisState === 'accepted'
            ? '接受并生成剧本'
            : '开始AI解析'
        }
        nextDisabled={loading}
      />
    </StepLayout>
  );
}

export default StepAnalysis;
