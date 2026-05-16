import {
  PipelineStep,
  StepInput,
  StepOutput,
  CheckpointState,
} from '../../../../core/pipeline/step.interface';
import { Script } from '../step1-script-generation/types/script';

import { selectBGM, BGMSelection } from './services/bgm-selector';
import {
  generateDialogueTTS,
  DialogueSegment,
  synthesizeAllDialogueAudio,
} from './services/dialogue-tts-generator';
import { assignVoices, VoiceAssignment } from './services/voice-assigner';

export interface VoiceSynthesisResult {
  script: Script;
  voiceAssignments: VoiceAssignment[];
  dialogueSegments: DialogueSegment[];
  bgmSelections: BGMSelection[];
  totalDuration: number; // 总时长（秒）
  metadata: {
    generatedAt: number;
    ttsEngine: string;
    voiceCount: number;
    synthesizedCount: number;
    failedCount: number;
  };
}

export class VoiceSynthesisPipeline implements PipelineStep<VoiceSynthesisResult> {
  id = 'voice-synthesis';
  name = 'Voice Synthesis';

  private _checkpoint: CheckpointState<VoiceSynthesisResult> | null = null;

  async execute(input: StepInput): Promise<StepOutput> {
    return this.process(input);
  }

  async process(input: StepInput): Promise<StepOutput> {
    const { script } = input as StepInput & { script: Script };

    // Step 1: 音色分配
    const voiceAssignments = assignVoices(script.characters);

    // Step 2: 生成 TTS 配音序列
    const { segments, totalDuration } = generateDialogueTTS(script, voiceAssignments);

    // Step 3: 使用 Edge-TTS 合成真实音频
    const synthesizedSegments = await synthesizeAllDialogueAudio(segments);

    // 统计合成结果
    const synthesizedCount = synthesizedSegments.filter((s) => s.status === 'done').length;
    const failedCount = synthesizedSegments.filter((s) => s.status === 'failed').length;

    // 计算实际总时长（使用实际生成的音频时长）
    const actualTotalDuration = synthesizedSegments.reduce((sum, seg) => {
      return sum + (seg.duration || seg.endTime - seg.startTime);
    }, 0);

    // Step 4: 选择 BGM
    const bgmSelections = selectBGM(script.scenes);

    const result: VoiceSynthesisResult = {
      script,
      voiceAssignments,
      dialogueSegments: synthesizedSegments,
      bgmSelections,
      totalDuration: actualTotalDuration || totalDuration,
      metadata: {
        generatedAt: Date.now(),
        ttsEngine: 'edge-tts',
        voiceCount: voiceAssignments.length,
        synthesizedCount,
        failedCount,
      },
    };

    return { voiceSynthesis: result } as StepOutput;
  }

  getCheckpoint() {
    return this._checkpoint;
  }

  restore(state: CheckpointState<VoiceSynthesisResult>) {
    this._checkpoint = state;
  }
}
