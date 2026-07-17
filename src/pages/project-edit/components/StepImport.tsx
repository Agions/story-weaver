/**
 * Step 0: 导入小说/剧本
 *
 * 通过 useStepImportContext() 获取 content/loading/onContentLoad/onRemove，
 * 不再依赖父组件层层传递 props。
 *
 * 改进：使用 StepLayout + pipeline/StepActions 替代手写的 Card shell，
 * 统一步骤外观并减少重复代码。
 */
import { FileText } from 'lucide-react';
import { lazy } from 'react';

import StepLayout from '@/components/common/StepLayout/StepLayout';
import { StepActions } from '@/components/pipeline/StepActions';
import { useProject } from '@/core/hooks/useProject';

import { useStepImportContext } from '../context/selectors';

const NovelImporter = lazy(() => import('@/components/ai/NovelImporter/NovelImporter'));

export interface StepImportProps {
  content?: string;
  loading?: boolean;
  onContentLoad?: (
    newContent: string,
    metadata: import('@/components/ai').ScriptImportMetadata
  ) => void;
  onRemove?: () => void;
  onNext?: () => void;
}

function StepImport() {
  const { content, loading, onContentLoad, onRemove } = useStepImportContext();
  const { setCurrentStep } = useProject();

  return (
    <StepLayout
      icon={<FileText className="h-5 w-5" />}
      title="导入小说/剧本"
      description="请导入小说或剧本文件，支持 TXT、MD、DOCX 格式。您也可以直接粘贴内容。"
      showActions={false}
    >
      <NovelImporter
        initialContent={content}
        onContentLoad={onContentLoad}
        onRemove={onRemove}
        loading={loading}
      />
      <StepActions onNext={() => setCurrentStep(1)} nextDisabled={!content} nextLabel="下一步" />
    </StepLayout>
  );
}

export default StepImport;
