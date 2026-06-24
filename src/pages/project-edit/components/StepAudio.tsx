/**
 * Step 7: 配音配乐
 */
import { Volume2 } from 'lucide-react';
import { lazy } from 'react';

import type { AudioTrackConfig } from '@/features/audio/components/AudioEditor';
import type { StoryboardFrame } from '@/features/storyboard/components/StoryboardEditor';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

import styles from '../ProjectEdit.module.less';

import { StepActions } from './StepActions';

const AudioEditor = lazy(() => import('@/features/audio/components/AudioEditor'));

export interface StepAudioProps {
  audioConfig: AudioTrackConfig;
  audioEditorKey: string;
  audioGenerating: boolean;
  scriptText: string;
  storyboardFrames: StoryboardFrame[];
  onConfigChange: (config: AudioTrackConfig) => void;
  onGenerateVoices: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function StepAudio({
  audioConfig,
  audioEditorKey,
  audioGenerating,
  scriptText,
  storyboardFrames,
  onConfigChange,
  onGenerateVoices,
  onPrev,
  onNext,
}: StepAudioProps) {
  return (
    <Card className={styles.stepCard}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          配音配乐
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">添加配音和背景音乐。</p>
        <div className={styles.audioActions}>
          <Button
            variant="default"
            onClick={onGenerateVoices}
            disabled={!scriptText || audioGenerating}
          >
            {audioGenerating ? '生成中...' : '一键生成配音'}
          </Button>
        </div>
        <div className={styles.audioContainer}>
          <AudioEditor
            key={audioEditorKey}
            initialConfig={audioConfig}
            onConfigChange={onConfigChange}
            videoDuration={Math.max(storyboardFrames.length * 5, 60)}
          />
        </div>
        <StepActions onPrev={onPrev} onNext={onNext} />
      </CardContent>
    </Card>
  );
}

export default StepAudio;
