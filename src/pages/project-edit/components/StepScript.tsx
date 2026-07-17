/**
 * Step 2: 编辑剧本
 *
 * 通过 useStepScriptContext() 获取 scriptText/onSaveScript，
 * 通过 useVersionControlContext() 获取版本控制能力。
 * 不再依赖父组件层层传递 props。
 */
import { Edit } from 'lucide-react';
import { lazy, useMemo, useState } from 'react';

import { useProject } from '@/core/hooks/useProject';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import type { VideoSegment } from '@/shared/types/script';
import type { StoryboardVersion } from '@/shared/types/project';

import { useStepScriptContext } from '../context/selectors';
import { useVersionControlContext } from '../context/selectors';
import styles from '../ProjectEdit.module.less';

import { StepActions } from '@/components/pipeline/StepActions';

const ScriptEditor = lazy(() => import('@/components/ai/ScriptEditor/ScriptEditor'));

export interface StepScriptProps {
  onExport?: (format: string) => void;
  onSave?: (segments: VideoSegment[]) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

function StepScript() {
  const { scriptText, onSaveScript } = useStepScriptContext();
  const { saveVersionByType, listVersionsByType, rollbackVersionByType } = useVersionControlContext();
  const { setCurrentStep } = useProject();
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [versionLabel, setVersionLabel] = useState('');
  const [scriptVersions, setScriptVersions] = useState<StoryboardVersion[]>([]);

  const handleSegmentsChange = useMemo(() => {
    return (updated: VideoSegment[]) => {
      setSegments(updated);
      onSaveScript(updated);
    };
  }, [onSaveScript]);

  const handleSaveVersion = () => {
    saveVersionByType('script', { scriptText, segments }, versionLabel || `剧本-${new Date().toLocaleString()}`);
    setScriptVersions(listVersionsByType('script') as StoryboardVersion[]);
    setVersionLabel('');
  };

  const handleRollback = (versionId: string) => {
    const payload = rollbackVersionByType('script', versionId);
    if (payload && typeof payload === 'object' && 'scriptText' in payload) {
      // rollback handled by parent
    }
  };

  return (
    <Card className={styles.stepCard}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          编辑剧本
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          编辑和优化AI生成的剧本内容，可以添加、删除或修改片段。
        </p>

        <div className={styles.versionControl}>
          <div className={styles.versionSaveRow}>
            <Input
              placeholder="版本标签（可选）"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              className="w-48"
            />
            <Button variant="outline" size="sm" onClick={handleSaveVersion}>
              保存剧本版本
            </Button>
          </div>
          {scriptVersions.length > 0 && (
            <div className={styles.versionList}>
              {scriptVersions.slice(0, 5).map((version) => (
                <div key={version.id} className={styles.versionItem}>
                  <span>{version.label || version.createdAt}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleRollback(version.id)}>
                    回滚
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <ScriptEditor segments={segments} onSegmentsChange={handleSegmentsChange} videoPath="" />

        <StepActions
          onPrev={() => setCurrentStep(1)}
          onNext={() => setCurrentStep(3)}
        />
      </CardContent>
    </Card>
  );
}

export default StepScript;
