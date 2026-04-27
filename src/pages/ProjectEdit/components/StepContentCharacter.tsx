/**
 * Step 4: 角色设计
 */
import { User } from 'lucide-react';
import React, { lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import type { Character } from '@/core/types';

import styles from '../../ProjectEdit.module.less';

const CharacterDesigner = lazy(() => import('@/features/character/components/CharacterDesigner'));

export interface StepContentCharacterProps {
  characters: Character[];
  projectId: string | undefined;
  onChange: (characters: Character[]) => void;
  onPrev: () => void;
  onNext: () => void;
}

const StepContentCharacter: React.FC<StepContentCharacterProps> = ({
  characters,
  projectId,
  onChange,
  onPrev,
  onNext,
}) => (
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
      <div className={styles.characterDesignerContainer}>
        <CharacterDesigner
          characters={characters}
          onChange={onChange}
          projectId={projectId}
        />
      </div>
      <div className={styles.stepActions}>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onPrev}>上一步</Button>
          <Button variant="default" onClick={onNext}>下一步</Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default StepContentCharacter;