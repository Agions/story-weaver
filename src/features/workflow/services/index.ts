/**
 * 工作流状态管理服务
 * n8n 风格工作流引擎 - 视频脚本视频生成
 */

import type {
  WorkflowDefinition,
  WorkflowExecutionState,
  WorkflowNode,
  WorkflowConnection,
  NodeExecutionResult,
  NodeExecutionStatus,
  WorkflowSettings,
  NodeCategory,
  MangaNodeType,
  NodeConfig,
  NodeTemplate,
  Project,
  Episode,
  ProjectSettings
} from '../types';
import {
  NODE_TEMPLATES,
  getNodeTemplate,
  getNodesByCategory,
  CATEGORY_INFO
} from './nodeTemplates';
import {
  getWorkflowTemplates,
  getWorkflowTemplate,
  createWorkflowFromTemplate
} from './workflowTemplates';
import { executeWorkflow, createWorkflowExecutor, workflowExecutionManager } from './executor';
import { projectManager } from './projectManager';

// ========== 工作流状态管理 ==========
class WorkflowManager {
  private workflows: Map<string, WorkflowDefinition> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // ========== 存储 ==========
  private saveToStorage(): void {
    try {
      const data = Array.from(this.workflows.values());
      localStorage.setItem('manga-workflows', JSON.stringify(data));
    } catch (e) {
      console.error('保存工作流失败:', e);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('manga-workflows');
      if (data) {
        const workflows = JSON.parse(data) as WorkflowDefinition[];
        workflows.forEach(w => this.workflows.set(w.id, w));
      }
    } catch (e) {
      console.error('加载工作流失败:', e);
    }
  }

  // ========== 工作流 CRUD ==========
  createWorkflow(
    name: string,
    projectId: string,
    episodeId?: string,
    episodeNumber?: number
  ): WorkflowDefinition {
    const workflow: WorkflowDefinition = {
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: '',
      projectId,
      episodeId,
      episodeNumber,
      nodes: [],
      connections: [],
      settings: {
        executionMode: 'sequential',
        errorHandling: 'stop',
        maxRetries: 3,
        timeout: 300000,
        enableLogging: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.workflows.set(workflow.id, workflow);
    this.saveToStorage();

    if (episodeId) {
      projectManager.updateEpisodeWorkflowStatus(projectId, episodeId, workflow.id, 'idle');
    }

    return workflow;
  }

  createFromTemplate(
    templateId: string,
    projectId: string,
    episodeId?: string,
    episodeNumber?: number
  ): WorkflowDefinition | undefined {
    const template = getWorkflowTemplate(templateId);
    if (!template) return undefined;

    const workflow: WorkflowDefinition = {
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: template.workflow.name,
      description: template.workflow.description,
      projectId,
      episodeId,
      episodeNumber,
      nodes: template.workflow.nodes.map(n => ({
        ...n,
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })),
      connections: template.workflow.connections.map(c => ({
        ...c,
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })),
      settings: template.workflow.settings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.workflows.set(workflow.id, workflow);
    this.saveToStorage();

    if (episodeId) {
      projectManager.updateEpisodeWorkflowStatus(projectId, episodeId, workflow.id, 'idle');
    }

    return workflow;
  }

  getWorkflow(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  getWorkflowsByProject(projectId: string): WorkflowDefinition[] {
    return Array.from(this.workflows.values()).filter(
      w => w.projectId === projectId
    );
  }

  getWorkflowByEpisode(episodeId: string): WorkflowDefinition | undefined {
    return Array.from(this.workflows.values()).find(
      w => w.episodeId === episodeId
    );
  }

  updateWorkflow(id: string, updates: Partial<WorkflowDefinition>): WorkflowDefinition | undefined {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;

    const updated = {
      ...workflow,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.workflows.set(id, updated);
    this.saveToStorage();
    return updated;
  }

  deleteWorkflow(id: string): boolean {
    const workflow = this.workflows.get(id);
    const deleted = this.workflows.delete(id);

    if (deleted && workflow?.episodeId) {
      projectManager.updateEpisodeWorkflowStatus(
        workflow.projectId,
        workflow.episodeId,
        '',
        'idle'
      );
      this.saveToStorage();
    }

    return deleted;
  }

  duplicateWorkflow(id: string): WorkflowDefinition | undefined {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;

    const newWorkflow: WorkflowDefinition = {
      ...JSON.parse(JSON.stringify(workflow)),
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${workflow.name} (副本)`,
      episodeId: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.workflows.set(newWorkflow.id, newWorkflow);
    this.saveToStorage();
    return newWorkflow;
  }

  // ========== 节点操作 ==========
  addNode(
    workflowId: string,
    type: string,
    position: { x: number; y: number },
    name?: string
  ): WorkflowNode | undefined {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return undefined;

    const template = getNodeTemplate(type);
    if (!template) return undefined;

    const node: WorkflowNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      name: name || template.name,
      position,
      inputs: template.inputs.map(p => ({ ...p, id: `port_${Math.random().toString(36).substr(2, 9)}` })),
      outputs: template.outputs.map(p => ({ ...p, id: `port_${Math.random().toString(36).substr(2, 9)}` })),
      config: { ...template.defaultConfig }
    };

    workflow.nodes.push(node);
    workflow.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return node;
  }

  updateNode(workflowId: string, nodeId: string, updates: Partial<WorkflowNode>): WorkflowNode | undefined {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return undefined;

    const nodeIndex = workflow.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return undefined;

    workflow.nodes[nodeIndex] = {
      ...workflow.nodes[nodeIndex],
      ...updates
    };
    workflow.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return workflow.nodes[nodeIndex];
  }

  deleteNode(workflowId: string, nodeId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    workflow.nodes = workflow.nodes.filter(n => n.id !== nodeId);
    workflow.connections = workflow.connections.filter(
      c => c.sourceNodeId !== nodeId && c.targetNode !== nodeId
    );

    workflow.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return true;
  }

  // ========== 连接操作 ==========
  addConnection(
    workflowId: string,
    sourceNodeId: string,
    sourcePort: string,
    targetNodeId: string,
    targetPort: string
  ): WorkflowConnection | undefined {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return undefined;

    const sourceNode = workflow.nodes.find(n => n.id === sourceNodeId);
    const targetNode = workflow.nodes.find(n => n.id === targetNodeId);
    if (!sourceNode || !targetNode) return undefined;

    const sourcePortExists = sourceNode.outputs.some(p => p.id === sourcePort);
    const targetPortExists = targetNode.inputs.some(p => p.id === targetPort);
    if (!sourcePortExists || !targetPortExists) return undefined;

    const exists = workflow.connections.some(
      c => c.sourceNodeId === sourceNodeId &&
           c.sourcePort === sourcePort &&
           c.targetNode === targetNodeId &&
           c.targetPort === targetPort
    );
    if (exists) return undefined;

    const connection: WorkflowConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceNodeId,
      sourcePort,
      targetNode: targetNodeId,
      targetPort
    };

    workflow.connections.push(connection);
    workflow.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return connection;
  }

  deleteConnection(workflowId: string, connectionId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    workflow.connections = workflow.connections.filter(c => c.id !== connectionId);
    workflow.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return true;
  }

  // ========== 执行 ==========
  async runWorkflow(
    workflowId: string,
    onProgress?: (nodeId: string, status: NodeExecutionStatus, result?: NodeExecutionResult) => void
  ): Promise<WorkflowExecutionState | undefined> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return undefined;

    workflow.executionStatus = 'running';
    this.saveToStorage();

    if (workflow.episodeId) {
      projectManager.updateEpisodeWorkflowStatus(
        workflow.projectId,
        workflow.episodeId,
        workflow.id,
        'running'
      );
    }

    try {
      const result = await executeWorkflow(workflow, onProgress);

      workflow.executionStatus = result.status;
      workflow.lastExecutedAt = new Date().toISOString();
      this.saveToStorage();

      if (workflow.episodeId) {
        projectManager.updateEpisodeWorkflowStatus(
          workflow.projectId,
          workflow.episodeId,
          workflow.id,
          result.status
        );
      }

      return result;
    } catch (error) {
      workflow.executionStatus = 'error';
      this.saveToStorage();

      if (workflow.episodeId) {
        projectManager.updateEpisodeWorkflowStatus(
          workflow.projectId,
          workflow.episodeId,
          workflow.id,
          'error'
        );
      }

      throw error;
    }
  }

  getExecutor(workflowId: string) {
    return workflowExecutionManager.getExecutor(workflowId);
  }
}

// 导出单例
export const workflowManager = new WorkflowManager();

// 导出所有值
export {
  NODE_TEMPLATES,
  getNodeTemplate,
  getNodesByCategory,
  CATEGORY_INFO,
  getWorkflowTemplates,
  getWorkflowTemplate,
  executeWorkflow,
  createWorkflowExecutor,
  workflowExecutionManager,
  projectManager,
  createWorkflowFromTemplate
};

// 类型导出
export type {
  WorkflowDefinition,
  WorkflowExecutionState,
  WorkflowNode,
  WorkflowConnection,
  NodeExecutionResult,
  NodeExecutionStatus,
  WorkflowSettings,
  NodeCategory,
  MangaNodeType,
  NodeConfig,
  NodeTemplate,
  Project,
  Episode,
  ProjectSettings
};
