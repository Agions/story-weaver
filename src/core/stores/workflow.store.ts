/**
 * 工作流状态管理
 * @deprecated 请使用 @/shared/stores/workflow.store
 */

export { useWorkflowStore, STEP_ORDER } from '@/shared/stores/workflow.store';
export type { WorkflowState, WorkflowStep, WorkflowStatus, StepState, HistoryItem } from '@/shared/stores/workflow.store';
