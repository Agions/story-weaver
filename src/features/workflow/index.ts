/**
 * features/workflow/index.ts
 * Workflow feature exports - Workflow management and execution
 */

// Types
export * from './types';

// Workflow Editor Components
export { WorkflowEditor } from './components/WorkflowEditor';
export { NODE_TEMPLATES, CATEGORY_INFO, getNodeTemplate, getNodesByCategory } from './components/nodeTemplates';
export type { NodeCategory, NodeTemplate } from './components/types';

// Services
export {
  workflowManager,
  getWorkflowTemplates,
  getWorkflowTemplate,
  executeWorkflow,
  createWorkflowExecutor,
  workflowExecutionManager,
  projectManager,
  createWorkflowFromTemplate
} from './services';

// Hooks
export { useWorkflow } from './hooks/useWorkflow';
export type {
  WorkflowStep,
  WorkflowState,
  WorkflowData,
  WorkflowCallbacks,
  WorkflowConfig
} from './hooks/useWorkflow';
