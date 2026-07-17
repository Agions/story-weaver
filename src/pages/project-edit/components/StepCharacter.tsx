/**
 * Step 4: 角色设计
 *
 * 通过 useStepCharacterContext() 获取 characters/onChange，
 * 通过 useVersionControlContext() 获取版本控制能力。
 * 不再依赖父组件层层传递 props。
 */
import { User } from 'lucide-react';
import { lazy, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useProject } from '@/core/hooks/useProject';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import type { StoryboardVersion } from '@/shared/types/project';

import { useStepCharacterContext } from '../context/selectors';
import { useVersionControlContext } from '../context/selectors';
import styles from '../ProjectEdit.module.less';

import { StepActions } from '@/components/pipeline/StepActions';

const CharacterDesigner = lazy(() =>
  import('@/components/ai').then((m) => ({ default: m.CharacterDesigner }))
);

export interface StepCharacterProps {
  characters?: import('@/shared/types').Character[];
  projectId?: string;
  onChange?: (characters: import('@/shared/types').Character[]) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

function StepCharacter() {
  const { characters, onChange } = useStepCharacterContext();
  const { saveVersionByType, listVersionsByType, rollbackVersionByType } = useVersionControlContext();
  const { projectId } = useParams();
  const { setCurrentStep } = useProject();
  const [versionLabel, setVersionLabel] = useState('');
  const [charVersions, setCharVersions] = useState<StoryboardVersion[]>([]);

  const handleSaveVersion = () => {
    saveVersionByType('character', characters, versionLabel || `角色-${new Date().toLocaleString()}`);
    setCharVersions(listVersionsByType('character') as StoryboardVersion[]);
    setVersionLabel('');
  };

  return (
    <Card className={styles.stepCard}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          角色设计
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          为故事中的角色创建和管理形象档案，确保视觉一致性。
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
              保存角色版本
            </Button>
          </div>
          {charVersions.length > 0 && (
            <div className={styles.versionList}>
              {charVersions.slice(0, 5).map((version) => (
                <div key={version.id} className={styles.versionItem}>
                  <span>{version.label || version.createdAt}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const payload = rollbackVersionByType('character', version.id);
                      if (payload && typeof payload === 'object' && 'characters' in payload) {
                        const chars = (payload as { characters: unknown[] }).characters;
                        if (Array.isArray(chars)) {
                          onChange(chars as typeof characters);
                        }
                      }
                    }}
                  >
                    回滚
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.characterDesignerContainer}>
          <CharacterDesigner characters={characters} onChange={onChange} projectId={projectId} />
        </div>
        <StepActions onPrev={() => setCurrentStep(3)} onNext={() => setCurrentStep(5)} />
      </CardContent>
    </Card>
  );
}

export default StepCharacter;
