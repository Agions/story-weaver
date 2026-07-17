/**
 * Pipeline Engine 类型定义
 */
import type { PipelineOptions, StepInput, StepOutput } from './step-interface';

export interface PipelineEngineEventHandler {
  onStepProgress?: (stepId: string, progress: number, message?: string) => void;
  onStepFail?: (stepId: string, error: string) => void;
  onQualityGate?: (stepId: string, decision: string, details?: string) => void;
  onComplete?: (results: Map<string, StepOutput>) => void;
  onStepStart?: (stepId: string) => void;
  onStepComplete?: (stepId: string, output: StepOutput) => void;
}

export interface PipelineMiddleware {
  name: string;
  onStepStart?: (stepId: string, input: StepInput) => void;
  onStepComplete?: (stepId: string, output: StepOutput) => void;
  onStepError?: (stepId: string, error: Error) => void;
  onPipelineStart?: () => void;
  onPipelineComplete?: (results: StepOutput) => void;
  onPipelineError?: (error: Error) => void;
}

export interface PipelineEngineOptions extends PipelineOptions {
  enableCheckpoint?: boolean;
  enableQualityGate?: boolean;
  workflowId?: string;
  projectId?: string;
  middlewares?: PipelineMiddleware[];
}
