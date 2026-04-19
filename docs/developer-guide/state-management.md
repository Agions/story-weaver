# 状态管理

PlotCraft 中基于 Zustand 的状态管理。

## 存储架构

```
shared/stores/
├── app.store.ts         # 全局应用状态
├── project.store.ts     # 当前项目状态
├── workflow.store.ts    # 工作流编辑器状态
├── storyboard.store.ts  # 分镜状态
├── character.store.ts   # 角色状态
└── ui.store.ts          # UI 状态 (弹窗、Toast)
```

## Zustand 存储

### AppStore

全局应用状态。

```typescript
interface AppState {
  // 设置
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'zh';
  
  // 状态
  isOnline: boolean;
  isLoading: boolean;
  
  // 操作
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
}
```

**用法:**
```typescript
import { useAppStore } from '@/shared/stores';

function ThemeToggle() {
  const { theme, setTheme } = useAppStore();
  return <button onClick={() => setTheme('dark')}>深色</button>;
}
```

### ProjectStore

当前项目数据。

```typescript
interface ProjectState {
  // 项目数据
  project: Project | null;
  isDirty: boolean;
  
  // 操作
  createProject: (data: ProjectData) => void;
  loadProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
  updateProject: (updates: Partial<Project>) => void;
}
```

### WorkflowStore

工作流编辑器状态。

```typescript
interface WorkflowState {
  // 工作流定义
  nodes: WorkflowNode[];
  connections: Connection[];
  
  // 编辑器状态
  selectedNodeId: string | null;
  zoom: number;
  pan: { x: number; y: number };
  
  // 执行
  isRunning: boolean;
  executionLog: LogEntry[];
  
  // 操作
  addNode: (node: WorkflowNode) => void;
  removeNode: (id: string) => void;
  connect: (from: string, to: string) => void;
  execute: () => Promise<void>;
}
```

### 持久化

存储可以持久化到 localStorage:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      project: null,
      isDirty: false,
      
      createProject: (data) => {
        set({ project: { id: uuid(), ...data }, isDirty: true });
      },
      // ...
    }),
    {
      name: 'plotcraft-project',  // localStorage 键
      partialize: (state) => ({
        project: state.project,
      }),
    }
  )
);
```

## 存储模式

### 计算值

```typescript
const useWorkflowStore = create<WorkflowState>()((set, get) => ({
  nodes: [],
  connections: [],
  
  // 计算值
  getNodeById: (id) => get().nodes.find(n => n.id === id),
  getConnectedNodes: (nodeId) => {
    const { nodes, connections } = get();
    return connections
      .filter(c => c.source === nodeId)
      .map(c => nodes.find(n => n.id === c.target));
  },
}));
```

### 异步操作

```typescript
const useProjectStore = create<ProjectState>()((set, get) => ({
  project: null,
  isLoading: false,
  
  loadProject: async (id) => {
    set({ isLoading: true });
    try {
      const project = await api.getProject(id);
      set({ project, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
```

### 订阅

```typescript
// 订阅存储变化
const unsubscribe = useAppStore.subscribe(
  (state) => state.isOnline,
  (isOnline) => {
    console.log('在线状态:', isOnline);
  }
);

// 清理时取消订阅
unsubscribe();
```

## 最佳实践

1. **就近原则** - 状态保持在使用它的地方附近
2. **规范化** - 规范化嵌套数据结构
3. **不可变性** - 不要直接修改状态
4. **持久化** - 只持久化必要的数据
5. **类型安全** - 始终定义 TypeScript 接口

## 从 Context 迁移

如果从 React Context 迁移:

```typescript
// 之前 (Context)
const ThemeContext = createContext<Theme>(defaultTheme);
export const useTheme = () => useContext(ThemeContext);

// 之后 (Zustand)
export const useAppStore = create<ThemeState>()((set) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
}));
export const useTheme = () => useAppStore((s) => s.theme);
```

## 开发工具

Zustand 集成 Redux DevTools:

```typescript
import { devtools } from 'zustand/middleware';

export const useStore = create<AppState>()(
  devtools(
    (set) => ({
      // ... 状态和操作
    }),
    { name: 'PlotCraft' }
  )
);
```
