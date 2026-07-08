/**
 * Step 2: 编辑剧本
 */
import { Edit } from 'lucide-react';
import { lazy, useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import type { VideoSegment } from '@/shared/types/script';

import styles from '../ProjectEdit.module.less';

import { StepActions } from './StepActions';

const ScriptEditor = lazy(() => import('@/features/script/components/ScriptEditor'));

export interface StepScriptProps {
  onExport: (format: string) => void;
  onSave: (segments: VideoSegment[]) => void;
  onPrev: () => void;
  onNext: () => void;
}

// onExport is kept in the props interface for parent-level wiring (StepContentSwitcher pass-through)
function StepScript({ onExport: _onExport, onPrev, onNext, onSave }: StepScriptProps) {
  const [segments, setSegments] = useState<VideoSegment[]>([]);

  const handleSegmentsChange = useMemo(() => {
    return (updated: VideoSegment[]) => {
      setSegments(updated);
      onSave(updated);
    };
  }, [onSave]);

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

        <ScriptEditor segments={segments} onSegmentsChange={handleSegmentsChange} videoPath="" />

        <StepActions onPrev={onPrev} onNext={onNext} />
      </CardContent>
    </Card>
  );
}

export default StepScript;
