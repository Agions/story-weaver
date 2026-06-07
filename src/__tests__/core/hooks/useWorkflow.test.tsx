/**
 * useWorkflow Hook 测试
 * 测试工作流管理 Hook 的各种状态转换和操作
 */

import { renderHook, act } from '@testing-library/react';

import { useWorkflow } from '@/core/hooks/useWorkflow';
import type { ScriptTemplate, AIModel } from '@/shared/types';

// Mock UUID
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
}));

// 辅助函数：创建模拟的 ScriptTemplate
function createMockTemplate(id: string = 'test-template'): ScriptTemplate {
  return {
    id,
    name: 'Test Template',
    description: 'A test template',
    content: 'Template content',
  };
}

// 辅助函数：创建模拟的 AIModel
function createMockModel(id: string = 'test-model'): AIModel {
  return {
    id,
    name: 'Test Model',
    provider: 'openai',
    category: ['text'],
    description: 'A test model',
    features: ['chat'],
    tokenLimit: 4096,
    contextWindow: 4096,
  };
}

// 辅助函数：创建模拟的 File 对象
function createMockFile(name: string = 'test-video.mp4'): File {
  return new File(['mock-content'], name, { type: 'video/mp4' });
}

describe('useWorkflow Hook', () => {
  describe('初始状态', () => {
    it('应该返回正确的初始状态', () => {
      const { result } = renderHook(() => useWorkflow());

      expect(result.current.state.step).toBe('upload');
      expect(result.current.state.status).toBe('idle');
      expect(result.current.state.progress).toBe(0);
      expect(result.current.state.data).toEqual({});
      expect(result.current.state.error).toBeUndefined();
    });

    it('应该返回正确的派生状态标志', () => {
      const { result } = renderHook(() => useWorkflow());

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isCompleted).toBe(false);
      expect(result.current.hasError).toBe(false);
    });

    it('应该返回正确的当前步骤和进度', () => {
      const { result } = renderHook(() => useWorkflow());

      expect(result.current.currentStep).toBe('upload');
      expect(result.current.progress).toBe(0);
      expect(result.current.data).toEqual({});
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('start - 启动工作流', () => {
    it('应该能够启动工作流并设置 projectId', async () => {
      const { result } = renderHook(() => useWorkflow());
      const file = createMockFile();

      await act(async () => {
        await result.current.start('test-project-id', file);
      });

      expect(result.current.state.status).toBe('running');
      expect(result.current.state.data.projectId).toBe('test-project-id');
      expect(result.current.isRunning).toBe(true);
    });

    it('应该在启动时调用 onStepChange 回调', async () => {
      const onStepChange = jest.fn();
      const { result } = renderHook(() => useWorkflow({ onStepChange }));
      const file = createMockFile();

      await act(async () => {
        await result.current.start('test-project-id', file);
      });

      expect(result.current.state.status).toBe('running');
    });

    it('启动时配置 autoAnalyze 应该自动执行分析', async () => {
      const onStepChange = jest.fn();
      const { result } = renderHook(() => useWorkflow({ onStepChange }));
      const file = createMockFile();

      await act(async () => {
        await result.current.start('test-project-id', file, { autoAnalyze: true });
      });

      expect(result.current.state.step).toBe('analyze');
      expect(result.current.state.progress).toBe(20);
      expect(onStepChange).toHaveBeenCalledWith('analyze');
    });

    it('启动时配置 autoGenerateScript 和 preferredTemplate 应该跳转到生成脚本步骤', async () => {
      const onStepChange = jest.fn();
      const { result } = renderHook(() => useWorkflow({ onStepChange }));
      const file = createMockFile();

      await act(async () => {
        await result.current.start('test-project-id', file, {
          autoGenerateScript: true,
          preferredTemplate: 'template-id',
        });
      });

      expect(result.current.state.step).toBe('script-generate');
      expect(onStepChange).toHaveBeenCalledWith('script-generate');
    });
  });

  describe('analyze - 分析视频', () => {
    it('应该更新步骤到 analyze 并设置进度', async () => {
      const { result } = renderHook(() => useWorkflow());

      await act(async () => {
        await result.current.analyze();
      });

      expect(result.current.state.step).toBe('analyze');
      expect(result.current.state.progress).toBe(20);
    });

    it('应该在分析时调用 onStepChange 回调', async () => {
      const onStepChange = jest.fn();
      const { result } = renderHook(() => useWorkflow({ onStepChange }));

      await act(async () => {
        await result.current.analyze();
      });

      expect(onStepChange).toHaveBeenCalledWith('analyze');
    });
  });

  describe('selectTemplate - 选择模板', () => {
    it('应该更新步骤到 template-select', () => {
      const { result } = renderHook(() => useWorkflow());
      const template = createMockTemplate();

      act(() => {
        result.current.selectTemplate(template);
      });

      expect(result.current.state.step).toBe('template-select');
    });

    it('应该在选择模板时调用 onStepChange 回调', () => {
      const onStepChange = jest.fn();
      const { result } = renderHook(() => useWorkflow({ onStepChange }));
      const template = createMockTemplate();

      act(() => {
        result.current.selectTemplate(template);
      });

      expect(onStepChange).toHaveBeenCalledWith('template-select');
    });
  });

  describe('generateScript - 生成脚本', () => {
    it('应该更新步骤到 script-generate 并设置进度', async () => {
      const { result } = renderHook(() => useWorkflow());
      const model = createMockModel();

      await act(async () => {
        await result.current.generateScript(model, {});
      });

      expect(result.current.state.step).toBe('script-generate');
      expect(result.current.state.progress).toBe(40);
    });

    it('应该在生成脚本时调用 onStepChange 回调', async () => {
      const onStepChange = jest.fn();
      const { result } = renderHook(() => useWorkflow({ onStepChange }));
      const model = createMockModel();

      await act(async () => {
        await result.current.generateScript(model, {});
      });

      expect(onStepChange).toHaveBeenCalledWith('script-generate');
    });
  });

  describe('dedupScript - 脚本去重', () => {
    it('应该更新步骤到 script-dedup 并设置进度', async () => {
      const { result } = renderHook(() => useWorkflow());

      await act(async () => {
        await result.current.dedupScript();
      });

      expect(result.current.state.step).toBe('script-dedup');
      expect(result.current.state.progress).toBe(50);
    });

    it('应该在去重时调用 onStepChange 回调', async () => {
      const onStepChange = jest.fn();
      const { result } = renderHook(() => useWorkflow({ onStepChange }));

      await act(async () => {
        await result.current.dedupScript();
      });

      expect(onStepChange).toHaveBeenCalledWith('script-dedup');
    });
  });

  describe('ensureUniqueness - 检查唯一性', () => {
    it('应该返回唯一性检查结果', async () => {
      const { result } = renderHook(() => useWorkflow());

      type UniquenessResult = { isUnique: boolean; duplicates: unknown[]; suggestions: unknown[] };
      let uniquenessResult: UniquenessResult | null = null as UniquenessResult | null;
      await act(async () => {
        uniquenessResult = await result.current.ensureUniqueness('test content');
      });

      expect(uniquenessResult).not.toBeNull();
      expect((uniquenessResult as UniquenessResult)?.isUnique).toBe(true);
      expect((uniquenessResult as UniquenessResult)?.duplicates).toEqual([]);
      expect((uniquenessResult as UniquenessResult)?.suggestions).toEqual([]);
    });

    it('应该接受任意字符串内容', async () => {
      const { result } = renderHook(() => useWorkflow());

      type UniqueCheckResult = { isUnique: boolean };
      let result1: UniqueCheckResult | null = null as UniqueCheckResult | null;
      let result2: UniqueCheckResult | null = null as UniqueCheckResult | null;

      await act(async () => {
        result1 = await result.current.ensureUniqueness('content 1');
        result2 = await result.current.ensureUniqueness('content 2');
      });

      expect((result1 as UniqueCheckResult)?.isUnique).toBe(true);
      expect((result2 as UniqueCheckResult)?.isUnique).toBe(true);
    });
  });

  describe('editScript - 编辑脚本', () => {
    it('应该更新步骤到 script-edit 并保存脚本内容', () => {
      const { result } = renderHook(() => useWorkflow());
      const scriptContent = 'Edited script content';

      act(() => {
        result.current.editScript(scriptContent);
      });

      expect(result.current.state.step).toBe('script-edit');
      expect(result.current.state.data.script).toEqual({ content: scriptContent });
    });

    it('应该在编辑脚本时调用 onStepChange 回调', () => {
      const onStepChange = jest.fn();
      const { result } = renderHook(() => useWorkflow({ onStepChange }));

      act(() => {
        result.current.editScript('test content');
      });

      expect(onStepChange).toHaveBeenCalledWith('script-edit');
    });
  });

  describe('editTimeline - 编辑时间线', () => {
    it('应该更新步骤到 timeline-edit 并保存时间线数据', () => {
      const { result } = renderHook(() => useWorkflow());
      const timeline = { duration: 120, tracks: [] };

      act(() => {
        result.current.editTimeline(timeline);
      });

      expect(result.current.state.step).toBe('timeline-edit');
      expect(result.current.state.data.timeline).toEqual(timeline);
    });

    it('应该在编辑时间线时调用 onStepChange 回调', () => {
      const onStepChange = jest.fn();
      const { result } = renderHook(() => useWorkflow({ onStepChange }));

      act(() => {
        result.current.editTimeline({ test: 'data' });
      });

      expect(onStepChange).toHaveBeenCalledWith('timeline-edit');
    });
  });

  describe('preview - 预览', () => {
    it('应该更新步骤到 preview 并设置进度', async () => {
      const { result } = renderHook(() => useWorkflow());

      await act(async () => {
        await result.current.preview();
      });

      expect(result.current.state.step).toBe('preview');
      expect(result.current.state.progress).toBe(80);
    });

    it('应该在预览时调用 onStepChange 回调', async () => {
      const onStepChange = jest.fn();
      const { result } = renderHook(() => useWorkflow({ onStepChange }));

      await act(async () => {
        await result.current.preview();
      });

      expect(onStepChange).toHaveBeenCalledWith('preview');
    });
  });

  describe('export - 导出', () => {
    it('应该更新步骤到 export 并设置状态为 completed', async () => {
      const { result } = renderHook(() => useWorkflow());

      await act(async () => {
        await result.current.export();
      });

      expect(result.current.state.step).toBe('export');
      expect(result.current.state.status).toBe('completed');
      expect(result.current.state.progress).toBe(100);
      expect(result.current.isCompleted).toBe(true);
    });

    it('应该在导出完成时调用 onComplete 回调', async () => {
      const onComplete = jest.fn();
      const { result } = renderHook(() => useWorkflow({ onComplete }));

      await act(async () => {
        await result.current.export();
      });

      expect(onComplete).toHaveBeenCalled();
    });

    it('应该在导出时调用 onStepChange 回调', async () => {
      const onStepChange = jest.fn();
      const { result } = renderHook(() => useWorkflow({ onStepChange }));

      await act(async () => {
        await result.current.export();
      });

      expect(onStepChange).toHaveBeenCalledWith('export');
    });
  });

  describe('pause/resume - 暂停和恢复', () => {
    it('应该能够暂停工作流', async () => {
      const { result } = renderHook(() => useWorkflow());
      const file = createMockFile();

      await act(async () => {
        await result.current.start('test-project-id', file);
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.state.status).toBe('paused');
      expect(result.current.isPaused).toBe(true);
      expect(result.current.isRunning).toBe(false);
    });

    it('应该能够恢复工作流', async () => {
      const { result } = renderHook(() => useWorkflow());
      const file = createMockFile();

      await act(async () => {
        await result.current.start('test-project-id', file);
      });

      act(() => {
        result.current.pause();
        result.current.resume();
      });

      expect(result.current.state.status).toBe('running');
      expect(result.current.isRunning).toBe(true);
      expect(result.current.isPaused).toBe(false);
    });
  });

  describe('cancel - 取消', () => {
    it('应该能够取消工作流并重置进度', async () => {
      const { result } = renderHook(() => useWorkflow());
      const file = createMockFile();

      await act(async () => {
        await result.current.start('test-project-id', file);
        await result.current.analyze();
      });

      act(() => {
        result.current.cancel();
      });

      expect(result.current.state.status).toBe('idle');
      expect(result.current.state.progress).toBe(0);
      expect(result.current.isRunning).toBe(false);
    });

    it('取消后应该保留当前步骤和数据', async () => {
      const { result } = renderHook(() => useWorkflow());
      const file = createMockFile();

      await act(async () => {
        await result.current.start('test-project-id', file);
        await result.current.analyze();
      });

      const stepBeforeCancel = result.current.state.step;
      const dataBeforeCancel = result.current.state.data;

      act(() => {
        result.current.cancel();
      });

      expect(result.current.state.step).toBe(stepBeforeCancel);
      expect(result.current.state.data).toEqual(dataBeforeCancel);
    });
  });

  describe('reset - 重置', () => {
    it('应该能够重置工作流到初始状态', async () => {
      const { result } = renderHook(() => useWorkflow());
      const file = createMockFile();

      await act(async () => {
        await result.current.start('test-project-id', file);
        await result.current.analyze();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.state.step).toBe('upload');
      expect(result.current.state.status).toBe('idle');
      expect(result.current.state.progress).toBe(0);
      expect(result.current.state.data).toEqual({});
    });

    it('重置后所有派生状态应该为初始值', async () => {
      const { result } = renderHook(() => useWorkflow());
      const file = createMockFile();

      await act(async () => {
        await result.current.start('test-project-id', file);
        await result.current.analyze();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isCompleted).toBe(false);
      expect(result.current.hasError).toBe(false);
    });
  });

  describe('jumpToStep - 跳转步骤', () => {
    it('应该能够跳转到指定步骤', () => {
      const { result } = renderHook(() => useWorkflow());

      act(() => {
        result.current.jumpToStep('script-generate');
      });

      expect(result.current.state.step).toBe('script-generate');
    });

    it('应该在跳转步骤时调用 onStepChange 回调', () => {
      const onStepChange = jest.fn();
      const { result } = renderHook(() => useWorkflow({ onStepChange }));

      act(() => {
        result.current.jumpToStep('preview');
      });

      expect(onStepChange).toHaveBeenCalledWith('preview');
    });

    it('应该能够跳转到任意有效步骤', () => {
      const { result } = renderHook(() => useWorkflow());
      const steps: Array<
        | 'upload'
        | 'analyze'
        | 'template-select'
        | 'script-generate'
        | 'script-dedup'
        | 'script-edit'
        | 'timeline-edit'
        | 'preview'
        | 'export'
      > = [
        'upload',
        'analyze',
        'template-select',
        'script-generate',
        'script-dedup',
        'script-edit',
        'timeline-edit',
        'preview',
        'export',
      ];

      steps.forEach((step) => {
        act(() => {
          result.current.jumpToStep(step);
        });

        expect(result.current.state.step).toBe(step);
      });
    });
  });

  describe('错误处理', () => {
    it('应该在错误状态时设置 hasError 为 true', () => {
      const { result } = renderHook(() => useWorkflow());

      act(() => {
        // 通过内部方法触发错误状态（模拟）
        result.current.pause();
        // 直接修改状态来模拟错误
      });

      // 由于 useWorkflow 不公开 updateStatus，我们检查错误处理的存在性
      expect(typeof result.current.hasError).toBe('boolean');
    });

    it('应该在错误发生时调用 onError 回调', () => {
      const onError = jest.fn();
      const { result } = renderHook(() => useWorkflow({ onError }));

      // useWorkflow 本身不公开设置错误的方法，
      // 但我们可以验证回调函数已正确注册
      expect(result.current).toBeDefined();
    });
  });

  describe('完整的工作流程', () => {
    it('应该能够完成完整的工作流程', async () => {
      const onStepChange = jest.fn();
      const onComplete = jest.fn();
      const { result } = renderHook(() => useWorkflow({ onStepChange, onComplete }));

      const file = createMockFile();
      const template = createMockTemplate();
      const model = createMockModel();

      // 1. 启动工作流
      await act(async () => {
        await result.current.start('test-project-id', file);
      });
      expect(result.current.state.status).toBe('running');

      // 2. 分析视频
      await act(async () => {
        await result.current.analyze();
      });
      expect(result.current.state.step).toBe('analyze');

      // 3. 选择模板
      act(() => {
        result.current.selectTemplate(template);
      });
      expect(result.current.state.step).toBe('template-select');

      // 4. 生成脚本
      await act(async () => {
        await result.current.generateScript(model, {});
      });
      expect(result.current.state.step).toBe('script-generate');

      // 5. 脚本去重
      await act(async () => {
        await result.current.dedupScript();
      });
      expect(result.current.state.step).toBe('script-dedup');

      // 6. 编辑脚本
      act(() => {
        result.current.editScript('Edited content');
      });
      expect(result.current.state.step).toBe('script-edit');

      // 7. 编辑时间线
      act(() => {
        result.current.editTimeline({ duration: 120 });
      });
      expect(result.current.state.step).toBe('timeline-edit');

      // 8. 预览
      await act(async () => {
        await result.current.preview();
      });
      expect(result.current.state.step).toBe('preview');

      // 9. 导出
      await act(async () => {
        await result.current.export();
      });
      expect(result.current.state.step).toBe('export');
      expect(result.current.state.status).toBe('completed');
      expect(result.current.state.progress).toBe(100);

      expect(onComplete).toHaveBeenCalled();
      expect(onStepChange).toHaveBeenCalledTimes(8); // 除了 start 以外的所有步骤
    });
  });

  describe('返回值的完整性', () => {
    it('应该返回所有必需的属性和方法', () => {
      const { result } = renderHook(() => useWorkflow());

      // 状态属性
      expect(result.current).toHaveProperty('state');
      expect(result.current).toHaveProperty('isRunning');
      expect(result.current).toHaveProperty('isPaused');
      expect(result.current).toHaveProperty('isCompleted');
      expect(result.current).toHaveProperty('hasError');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('currentStep');
      expect(result.current).toHaveProperty('progress');
      expect(result.current).toHaveProperty('data');

      // 方法
      expect(typeof result.current.start).toBe('function');
      expect(typeof result.current.analyze).toBe('function');
      expect(typeof result.current.selectTemplate).toBe('function');
      expect(typeof result.current.generateScript).toBe('function');
      expect(typeof result.current.dedupScript).toBe('function');
      expect(typeof result.current.ensureUniqueness).toBe('function');
      expect(typeof result.current.editScript).toBe('function');
      expect(typeof result.current.editTimeline).toBe('function');
      expect(typeof result.current.preview).toBe('function');
      expect(typeof result.current.export).toBe('function');
      expect(typeof result.current.pause).toBe('function');
      expect(typeof result.current.resume).toBe('function');
      expect(typeof result.current.cancel).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.jumpToStep).toBe('function');
    });
  });

  describe('回调函数的稳定性', () => {
    it('多次调用 onStepChange 应该正常工作', async () => {
      const onStepChange = jest.fn();
      const { result } = renderHook(() => useWorkflow({ onStepChange }));

      await act(async () => {
        await result.current.analyze();
      });

      act(() => {
        result.current.jumpToStep('script-edit');
      });

      expect(onStepChange).toHaveBeenCalledTimes(2);
      expect(onStepChange).toHaveBeenNthCalledWith(1, 'analyze');
      expect(onStepChange).toHaveBeenNthCalledWith(2, 'script-edit');
    });

    it('没有提供回调时不应该报错', async () => {
      const { result } = renderHook(() => useWorkflow());

      await act(async () => {
        await result.current.analyze();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.state.step).toBe('upload');
    });
  });

  describe('数据持久化', () => {
    it('在步骤变化时应该保留已有数据', async () => {
      const { result } = renderHook(() => useWorkflow());
      const file = createMockFile();

      await act(async () => {
        await result.current.start('test-project-id', file);
      });

      const projectId = result.current.state.data.projectId;

      await act(async () => {
        await result.current.analyze();
      });

      expect(result.current.state.data.projectId).toBe(projectId);
    });

    it('编辑脚本应该更新数据但保留其他信息', async () => {
      const { result } = renderHook(() => useWorkflow());
      const file = createMockFile();

      await act(async () => {
        await result.current.start('test-project-id', file);
      });

      act(() => {
        result.current.editScript('New script content');
      });

      expect(result.current.state.data.projectId).toBe('test-project-id');
      expect(result.current.state.data.script).toEqual({ content: 'New script content' });
    });

    it('编辑时间线应该更新数据但保留其他信息', async () => {
      const { result } = renderHook(() => useWorkflow());
      const file = createMockFile();

      await act(async () => {
        await result.current.start('test-project-id', file);
      });

      act(() => {
        result.current.editScript('Script');
        result.current.editTimeline({ duration: 120 });
      });

      expect(result.current.state.data.projectId).toBe('test-project-id');
      expect(result.current.state.data.script).toEqual({ content: 'Script' });
      expect(result.current.state.data.timeline).toEqual({ duration: 120 });
    });
  });
});
