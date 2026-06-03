# frame-fab 开发指南

## 项目概述

frame-fab 是 AI 驱动的 **AI 漫剧创作平台**，输入一本小说，AI 自动把它拍成一部漫剧。基于 Tauri 2.1 + Rust 桌面端，集成多模型 AI（GLM-5 / M2.5 / Kimi / Seedream / Kling / Vidu / Edge TTS）实现端到端自动化。

## 技术栈

- **前端框架**：React 18 · TypeScript 5 · Vite 5
- **UI 组件**：shadcn/ui (Radix UI + Tailwind CSS)
- **状态管理**：Zustand
- **桌面端**：Tauri 2.1 (Rust)
- **动画**：Framer Motion
- **国际化**：i18next
- **测试**：Jest · React Testing Library

## 项目结构

```
frame-fab/
├── src/                          # 前端 UI 层（React + Tauri API 包装）
│   ├── features/                 # 14 个 Feature 模块（DDD 风格）
│   │   ├── ai/                   # AI 模型选择
│   │   ├── audio/                # 音频编辑
│   │   ├── auto-pipeline/        # 自主流水线
│   │   ├── character/            # 角色设计
│   │   ├── cost/                 # 成本追踪
│   │   ├── editor/               # 可视化编辑器（Timeline）
│   │   ├── export/               # 导出功能
│   │   ├── home/                 # 首页
│   │   ├── manga-pipeline/       # 漫剧流水线 (核心)
│   │   ├── notification/         # 通知系统
│   │   ├── project/              # 项目管理
│   │   ├── script/               # 脚本生成
│   │   ├── storyboard/           # 分镜编辑
│   │   ├── subtitle/             # 字幕编辑
│   │   ├── video/                # 视频播放
│   │   └── video-export/         # 视频导出
│   ├── shared/                   # 跨域共享
│   │   ├── components/           # 可复用 UI 组件 (业务 + ui)
│   │   ├── hooks/                # 可复用 React Hooks
│   │   ├── services/             # 存储、API 客户端
│   │   ├── stores/               # Zustand 状态存储（5 个全局 Store）
│   │   ├── types/                # 共享类型
│   │   └── utils/                # 工具函数
│   ├── core/                     # 核心服务
│   │   ├── pipeline/             # 10 步流水线引擎 + PipelineEngine + AsyncStepChain
│   │   ├── autonomous/           # 自主编排层 (AutoPipelineEngine)
│   │   ├── services/             # AI/视频/音频服务（6 领域子目录）
│   │   ├── hooks/                # 核心 Hooks
│   │   ├── config/               # 运行时配置 (app.config / optimization.config)
│   │   └── types/                # 核心类型
│   ├── pages/                    # 路由级页面
│   ├── infrastructure/           # Tauri IPC 桥接 + telemetry
│   └── main.tsx                  # React 入口
├── packages/                     # Monorepo 子包
│   ├── core/                     # 领域核心（pipeline / autonomous / types）
│   │   ├── autonomous/evaluator/ # QualityGate + SelfReviewLoop
│   │   └── types/                # PipelineCheckpoint / StepState
│   └── common/                   # 基础类型/工具（无副作用）
├── src-tauri/                    # Tauri 桌面端（Rust 第一公民）
│   ├── src/commands/             # 21 个 Tauri Commands（按域路由）
│   │   ├── video.rs              # FFmpeg 视频
│   │   ├── app.rs                # 窗口/设置
│   │   ├── file.rs               # 文件/项目
│   │   └── shortcuts.rs          # 全局快捷键
│   ├── src/services/             # FFmpeg/视频/配置业务逻辑
│   ├── src/models/               # Rust 数据模型
│   ├── src/utils/                # 路径验证/ID 生成/FFPS 解析
│   └── src/constants/            # 允许目录白名单
├── docs/                         # VitePress 文档站
│   ├── adr/                      # 架构决策记录 (ADR)
│   ├── api/                      # API 参考
│   ├── performance/              # 性能基准报告
│   ├── developer-guide/          # 架构/项目结构/服务
│   ├── getting-started/          # 5 分钟启动/配置
│   ├── user-guide/               # 工作流说明
│   └── deployment/               # 构建/环境/Docker
├── e2e/                          # Playwright E2E 测试
├── assets/                       # 品牌资源（logo 系统）
├── public/                       # Vite 静态资源
└── scripts/                      # 构建脚本
```

## 核心架构原则

- **依赖方向唯一性**：`packages/common → packages/core → src`，禁止反向依赖
- **Rust 后端是第一公民**：FFmpeg/文件 I/O/窗口/快捷键/配置全在 Rust，JS/TS 仅做 UI
- **领域驱动分层**：`core/services/` 按 ai/video/audio/pipeline/project/domain 划分
- **Barrel 导出规范**：`index.ts` 仅 `export { }`，禁止混入逻辑
- **Tauri IPC 类型安全**：所有 `#[tauri::command]` 函数返回 `Result<T, String>`，路径必须经过 `validate_input_path` / `validate_output_path` 校验

## 开发指南

### 添加新服务

1. 在对应的子目录创建服务文件（按 DDD 领域划分）：
   - AI 文本：`src/core/services/ai/text/`
   - AI 图像/视频：`src/core/services/ai/image/`
   - 视频处理：`src/core/services/video/`
   - 音频/TTS：`src/core/services/audio/`
   - Pipeline：`src/core/services/pipeline/`
   - 项目/导出：`src/core/services/project/`
   - 领域业务：`src/core/services/domain/`
2. 使用单例模式导出
3. 在 `src/core/services/index.ts` 的对应子域 barrel 中导出

```typescript
// src/core/services/ai/text/example.service.ts
class ExampleService {
  private static instance: ExampleService;

  static getInstance(): ExampleService {
    if (!ExampleService.instance) {
      ExampleService.instance = new ExampleService();
    }
    return ExampleService.instance;
  }
}

export const exampleService = ExampleService.getInstance();
```

### 添加新状态

1. 在 `src/shared/stores/` 创建 store 文件
2. 使用 Zustand 的 persist 中间件
3. 配置防抖存储以优化性能

```typescript
// src/shared/stores/example.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ExampleState {
  data: string;
  setData: (data: string) => void;
}

export const useExampleStore = create<ExampleState>()(
  persist(
    (set) => ({
      data: '',
      setData: (data) => set({ data }),
    }),
    {
      name: 'example-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 添加新组件

1. UI 基元组件放入 `packages/shared/ui/primitives/`（PascalCase.component.tsx 命名）
2. Feature 业务组件放入对应 `src/features/<feature>/components/`
3. 通过 `cn()` 工具合并 className

```typescript
// packages/shared/ui/primitives/Example.component.tsx
import { cn } from '@/shared/utils/class-names';

interface ExampleProps {
  className?: string;
  children?: React.ReactNode;
}

export function Example({ className, children }: ExampleProps) {
  return <div className={cn('some-class', className)}>{children}</div>;
}
```

## 命令

```bash
# 开发模式
pnpm dev

# 生产构建
pnpm build

# 类型检查
pnpm build:check

# 运行测试
pnpm test

# 快速测试（含覆盖率）
pnpm test:fast

# 监听模式
pnpm test:watch

# 构建 Tauri 桌面应用
pnpm tauri build

# 代码检查
pnpm lint

# 自动修复代码检查问题
pnpm lint:fix

# 构建文档
pnpm docs:vp:build

# 开发文档
pnpm docs:vp:dev
```

## AI 服务使用

```typescript
import { aiService } from '@/core/services';

// 文本生成
const result = await aiService.generate('写一段戏剧性场景', {
  provider: 'minimax',
  model: 'M2.5',
  maxTokens: 1000,
});
console.log(result.content);

// 多轮对话
const chatResult = await aiService.chat(messages, {
  provider: 'minimax',
  model: 'M2.5',
});
```

## 测试

- 使用 TypeScript 严格模式
- 使用函数式组件 + Hooks
- 遵循 React 组件拆分原则
- 使用 ESLint + Prettier 格式化

## 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 类型

| Type       | Description              |
| ---------- | ------------------------ |
| `feat`     | 新功能                   |
| `fix`      | Bug 修复                 |
| `docs`     | 文档变更                 |
| `style`    | 代码格式化（无逻辑变更） |
| `refactor` | 代码重构                 |
| `perf`     | 性能改进                 |
| `test`     | 添加或更新测试           |
| `build`    | 构建系统变更             |
| `ci`       | CI/CD 配置变更           |
| `chore`    | 其他变更                 |

### 示例

```bash
# 新功能
git commit -m "feat(editor): add video preview functionality"

# Bug 修复
git commit -m "fix(workflow): resolve pipeline cancellation issue"

# 文档
git commit -m "docs(readme): update installation instructions"

# 重构
git commit -m "refactor(services): extract common retry logic"
```
