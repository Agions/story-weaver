/**
 * useProject.reducer 单元测试
 *
 * 覆盖 projectReducer + createProjectSetters 的状态转换契约。
 */

import {
  projectReducer,
  initialProjectState,
  createProjectSetters,
} from '@/core/hooks/useProject.reducer';
import type { ProjectAction } from '@/core/hooks/useProject.reducer';

describe('projectReducer', () => {
  it('应返回初始状态的深拷贝引用', () => {
    expect(initialProjectState).toEqual({
      project: null,
      projects: [],
      isLoading: false,
      isSaving: false,
      error: null,
      hasUnsavedChanges: false,
      currentStep: 0,
      taskStatus: null,
    });
  });

  it('set action: 直接替换字段值', () => {
    const action: ProjectAction = { type: 'set', key: 'isLoading', value: true };
    const next = projectReducer(initialProjectState, action);

    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull(); // 其他字段不变
  });

  it('set action: 更新 currentStep', () => {
    const action: ProjectAction = { type: 'set', key: 'currentStep', value: 3 };
    const next = projectReducer(initialProjectState, action);

    expect(next.currentStep).toBe(3);
  });

  it('update action: 使用函数 updater 修改 projects 数组', () => {
    const existing = { id: 'p1', name: 'A' };
    const state = { ...initialProjectState, projects: [existing] as never[] };

    const newProject = { id: 'p2', name: 'B' };
    const action: ProjectAction = {
      type: 'update',
      key: 'projects',
      updater: (prev) => [...(prev as never[]), newProject],
    };
    const next = projectReducer(state, action);

    expect(next.projects).toHaveLength(2);
    expect(next.projects[1]).toEqual(newProject);
  });

  it('update action: 基于 prev 的 set 模式 (与 setter factory 同构)', () => {
    const action: ProjectAction = {
      type: 'update',
      key: 'hasUnsavedChanges',
      updater: (prev) => !prev,
    };
    const next = projectReducer(initialProjectState, action);

    expect(next.hasUnsavedChanges).toBe(true);
  });

  it('未知 action 类型应返回原 state (reducer 幂等)', () => {
    const unknown = { type: 'UNKNOWN' } as unknown as ProjectAction;
    const next = projectReducer(initialProjectState, unknown);

    expect(next).toBe(initialProjectState);
  });

  it('set taskStatus 应支持 null (接口契约)', () => {
    const action: ProjectAction = { type: 'set', key: 'taskStatus', value: null };
    const next = projectReducer(initialProjectState, action);

    expect(next.taskStatus).toBeNull();
  });
});

describe('createProjectSetters', () => {
  it('应工厂化生成 7 个 setter 方法', () => {
    const dispatched: ProjectAction[] = [];
    const setters = createProjectSetters((a) => dispatched.push(a));

    expect(setters).toHaveProperty('setProject');
    expect(setters).toHaveProperty('setProjects');
    expect(setters).toHaveProperty('setIsLoading');
    expect(setters).toHaveProperty('setIsSaving');
    expect(setters).toHaveProperty('setError');
    expect(setters).toHaveProperty('setHasUnsavedChanges');
    expect(setters).toHaveProperty('setCurrentStep');
    expect(dispatched).toHaveLength(0);
  });

  it('传入值时发出 set action', () => {
    const dispatched: ProjectAction[] = [];
    const setters = createProjectSetters((a) => dispatched.push(a));

    setters.setIsLoading(true);

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]).toEqual({ type: 'set', key: 'isLoading', value: true });
  });

  it('传入函数时发出 update action', () => {
    const dispatched: ProjectAction[] = [];
    const setters = createProjectSetters((a) => dispatched.push(a));

    setters.setCurrentStep((prev) => prev + 1);

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].type).toBe('update');
    expect((dispatched[0] as { key: string }).key).toBe('currentStep');
  });

  it('函数 updater 应接收 prev 值并返回新值', () => {
    let capturedPrev: unknown = 'NOT_SET';
    const dispatched: ProjectAction[] = [];
    const setters = createProjectSetters((a) => dispatched.push(a));

    setters.setCurrentStep((prev) => {
      capturedPrev = prev;
      return 99;
    });

    // dispatch 不会立即执行 updater
    expect(capturedPrev).toBe('NOT_SET');

    // 手动调用 updater 模拟 reducer 行为
    const action = dispatched[0];
    if (action.type === 'update') {
      const result = action.updater(42);
      expect(capturedPrev).toBe(42); // updater 收到了传入的 prev
      expect(result).toBe(99); // 返回新值
    } else {
      fail('expected update action');
    }
  });
});
