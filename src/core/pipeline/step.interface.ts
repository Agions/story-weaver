export type StepInput = Record<string, unknown>;
export type StepOutput = Record<string, unknown>;

export interface CheckpointState<S = unknown> {
  stepId: string;
  completed: boolean;
  data: S;
  timestamp: number;
}

import { PipelineExecutionMode } from './pipeline.types';

export interface PipelineStep<S = unknown> {
  id: string;
  name: string;
  stepId?: string;
  mode?: PipelineExecutionMode;
  execute(input: StepInput): Promise<StepOutput>;
  getCheckpoint?(): CheckpointState<S> | null;
  restore?(state: CheckpointState<S>): void;
  onProgress?: (event: { stepId: string; progress: number; message: string }) => void;
}

export interface PipelineOptions {
  onProgress?: (stepId: string, progress: number) => void;
  onComplete?: (output: StepOutput) => void;
  onError?: (stepId: string, error: Error) => void;
}
