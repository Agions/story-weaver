// Mock nodeTemplates for tests
export interface NodeTemplate {
  type: string;
  label: string;
  name?: string;
  icon?: string;
  category?: string;
}

export const CATEGORY_INFO: Record<string, { label: string; color: string }> = {
  trigger: { label: '触发器', color: '#1890ff' },
  action: { label: '动作', color: '#52c41a' },
  condition: { label: '条件', color: '#faad14' },
  logic: { label: '逻辑', color: '#722ed1' },
  utility: { label: '工具', color: '#8c8c8c' },
  ai: { label: 'AI', color: '#eb2f96' },
  video: { label: '视频', color: '#13c2c2' },
  audio: { label: '音频', color: '#fa8c16' },
  input: { label: '输入', color: '#1890ff' },
  output: { label: '输出', color: '#52c41a' },
};

export function getNodesByCategory(category: string): NodeTemplate[] {
  return [];
}

export function getNodeTemplate(type: string): NodeTemplate | undefined {
  return undefined;
}

export const workflowManager = {
  getWorkflows: () => [],
  getWorkflow: (id: string) => undefined,
  createWorkflow: (data: any) => ({ id: 'mock-id', ...data }),
  updateWorkflow: (id: string, data: any) => ({ id, ...data }),
  deleteWorkflow: (id: string) => {},
  createFromTemplate: (templateId: string, data?: any) => ({ id: 'mock-id', templateId, ...data }),
};
