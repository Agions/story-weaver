/** 工作流节点模板定义 */

import { generatePrefixedId } from '@/shared/utils';

export interface NodeTemplate {
  type: string;
  label: string;
  name?: string;
  icon?: string;
  category?: string;
  description?: string;
}

/** 工作流数据结构 */
export interface WorkflowData {
  id?: string;
  name?: string;
  nodes?: NodeTemplate[];
  edges?: unknown[];
  connections?: unknown[];
  metadata?: Record<string, unknown>;
}

export const CATEGORY_INFO: Record<string, { label: string; color: string }> = {
  input: { label: '输入', color: '#3b82f6' },
  output: { label: '输出', color: '#10b981' },
  ai: { label: 'AI', color: '#8b5cf6' },
  video: { label: '视频', color: '#13c2c2' },
  audio: { label: '音频', color: '#fa8c16' },
  logic: { label: '逻辑', color: '#722ed1' },
  utility: { label: '工具', color: '#8c8c8c' },
};

/** 节点模板注册表 */
const nodeTemplates: NodeTemplate[] = [
  // 输入类
  { type: 'video-input', name: '视频输入', label: '视频输入', category: 'input', description: '输入视频文件' },
  { type: 'audio-input', name: '音频输入', label: '音频输入', category: 'input', description: '输入音频文件' },
  { type: 'image-input', name: '图片输入', label: '图片输入', category: 'input', description: '输入图片文件' },
  { type: 'text-input', name: '文本输入', label: '文本输入', category: 'input', description: '输入文本内容' },
  
  // 输出类
  { type: 'video-export', name: '视频导出', label: '视频导出', category: 'output', description: '导出视频文件' },
  { type: 'audio-export', name: '音频导出', label: '音频导出', category: 'output', description: '导出音频文件' },
  
  // AI类
  { type: 'script-generator', name: '脚本生成', label: '脚本生成', category: 'ai', description: '使用AI生成脚本' },
  { type: 'image-generator', name: '图片生成', label: '图片生成', category: 'ai', description: '使用AI生成图片' },
  { type: 'tts-generator', name: '语音合成', label: '语音合成', category: 'ai', description: '文本转语音' },
  
  // 视频类
  { type: 'video-trim', name: '视频剪辑', label: '视频剪辑', category: 'video', description: '剪辑视频片段' },
  { type: 'video-merge', name: '视频合并', label: '视频合并', category: 'video', description: '合并多个视频' },
  
  // 音频类
  { type: 'audio-mix', name: '音频混音', label: '音频混音', category: 'audio', description: '混合多个音频' },
  { type: 'audio-normalize', name: '音频标准化', label: '音频标准化', category: 'audio', description: '标准化音频音量' },
  
  // 逻辑类
  { type: 'condition', name: '条件分支', label: '条件分支', category: 'logic', description: '根据条件分支执行' },
  { type: 'loop', name: '循环', label: '循环', category: 'logic', description: '循环执行节点' },
  
  // 工具类
  { type: 'delay', name: '延迟', label: '延迟', category: 'utility', description: '延迟执行' },
  { type: 'logger', name: '日志', label: '日志', category: 'utility', description: '记录日志' },
];

/** 工作流模板 */
const workflowTemplates: Record<string, { name: string; nodes: WorkflowData['nodes'] }> = {
  'basic-video': {
    name: '基础视频脚本生成',
    nodes: [
      { type: 'text-input', name: '文本输入', label: '文本输入', category: 'input' },
      { type: 'script-generator', name: '脚本生成', label: '脚本生成', category: 'ai' },
      { type: 'video-export', name: '视频导出', label: '视频导出', category: 'output' },
    ],
  },
};

/** 存储工作流数据 */
const workflowStore: Map<string, WorkflowData> = new Map();

export function getNodesByCategory(category: string): NodeTemplate[] {
  return nodeTemplates.filter(node => node.category === category);
}

export function getNodeTemplate(type: string): NodeTemplate | undefined {
  return nodeTemplates.find(node => node.type === type);
}

export const workflowManager = {
  getWorkflows(): WorkflowData[] {
    return Array.from(workflowStore.values());
  },
  
  getWorkflow(id: string): WorkflowData | null {
    return workflowStore.get(id) ?? null;
  },
  
  createWorkflow(name: string): WorkflowData {
    const workflow: WorkflowData = {
      id: generatePrefixedId('wf'),
      name,
      nodes: [],
      connections: [],
    };
    workflowStore.set(workflow.id!, workflow);
    return workflow;
  },
  
  updateWorkflow(id: string, data: WorkflowData): WorkflowData {
    const existing = workflowStore.get(id);
    if (!existing) {
      throw new Error(`Workflow ${id} not found`);
    }
    const updated = { ...existing, ...data, id };
    workflowStore.set(id, updated);
    return updated;
  },
  
  deleteWorkflow(id: string): void {
    workflowStore.delete(id);
  },
  
  createFromTemplate(templateId: string, data?: WorkflowData): WorkflowData | null {
    const template = workflowTemplates[templateId];
    if (!template) {
      return null;
    }
    const workflow: WorkflowData = {
      id: generatePrefixedId('wf'),
      name: template.name,
      nodes: template.nodes,
      connections: [],
      ...data,
    };
    workflowStore.set(workflow.id!, workflow);
    return workflow;
  },
};