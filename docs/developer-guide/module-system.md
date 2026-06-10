---
title: 模块系统
description: frame-fab v3.0 的领域分层与目录结构
---

# 模块系统

frame-fab 采用**领域驱动设计 (DDD)** 的轻量分层架构。从 v3.0 开始,目录按用户故事切分,业务与技术分离。

## 顶层结构

```
frame-fab/
├── app/                # 应用入口: 路由、Providers、Layout
├── pages/              # 路由级页面 (7 个)
├── features/           # 业务功能 (按用户故事切,9 个)
├── shared/             # 通用 UI / hooks / utils / api
├── core/               # 技术核心 (framework-specific)
├── domain/             # 业务领域模型 (零依赖)
└── __tests__/          # 镜像结构测试
```

## 依赖规则

```
app → pages → features → shared → core → domain
                                     ↓
                                  (叶子,无依赖)
```

- **domain** 零依赖,纯 TypeScript 类型 + 业务规则
- **core** 依赖 domain,提供技术能力 (DI、Router、Pipeline)
- **shared** 依赖 core,提供跨功能复用的工具
- **features** 依赖 shared + core,实现具体业务
- **pages** 依赖 features,组合页面
- **app** 依赖 pages,启动应用

**禁止反向依赖**:`domain` 不能 import `@/core/*`,`core` 不能 import `@/features/*`。

## 9 大 features

按用户故事切分,每个 feature 是一个独立的业务模块:

| Feature       | 职责                   | 主要页面                           |
| ------------- | ---------------------- | ---------------------------------- |
| `script/`     | 小说/剧本导入、分析    | Workflow Step 1-2                  |
| `storyboard/` | 分镜设计、首帧图生成   | Workflow Step 3                    |
| `character/`  | 角色资产生成、形象库   | Workflow Step 4                    |
| `render/`     | 视频/图像渲染队列      | Workflow Step 5                    |
| `compose/`    | 合成、配音、字幕、导出 | Workflow Step 6-7                  |
| `pipeline/`   | 自主流水线 + 自审循环  | AutoPipelinePage                   |
| `project/`    | 项目管理、CRUD         | ProjectEditPage, ProjectDetailPage |
| `cost/`       | 成本统计、评估         | CostPanel                          |
| `collab/`     | 协作、共享 (实验)      | —                                  |

每个 feature 内部:

```
features/script/
├── components/         # 该 feature 专属的 UI 组件
├── hooks/              # 该 feature 专属的 hooks
├── services/           # 该 feature 业务逻辑
├── stores/             # 状态管理 (Zustand)
├── types.ts            # 该 feature 内部类型
└── index.ts            # 公共 API (其它模块只能 import 这个)
```

**对外只暴露 `index.ts`**,内部实现可以自由重构,不会破坏其它模块。

## 7 大 core 模块

| Module           | 职责                                   |
| ---------------- | -------------------------------------- |
| `core/di/`       | 依赖注入容器 + Service Registry        |
| `core/router/`   | 路由配置 + 懒加载 + 预加载策略         |
| `core/pipeline/` | PipelineEngine + 步骤框架 + Checkpoint |
| `core/ai/`       | LLM 客户端 + Chain + Provider Registry |
| `core/platform/` | 平台适配层 (Tauri / Web)               |
| `core/stores/`   | 全局状态 (Zustand)                     |
| `core/config/`   | 应用配置 + 优化配置                    |

## 命名规范

- **文件**: `kebab-case.ts` (例: `script-import.service.ts`)
- **组件**: `PascalCase.tsx` (例: `StoryboardGrid.tsx`)
- **类型**: `IFoo` / `TFoo` / `EFoo` (根据文件角色加前缀)
- **Service**: `xxx.service.ts` (例: `character.service.ts`)
- **Hook**: `useXxx.ts` (例: `useProject.ts`)
- **Store**: `xxx.store.ts` (例: `project.store.ts`)
- **布尔变量**: `is/has/can/should` 前缀
- **函数**: 动词开头 (`createXxx` / `formatXxx` / `parseXxx`)
- **常量**: `UPPER_SNAKE_CASE`

## 路径别名

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@frame-fab/common/*": ["./packages/common/src/*"]
    }
  }
}
```

使用:

```typescript
import { platform } from '@/core/platform';
import { ProjectService } from '@/features/project/services/project.service';
import type { Script } from '@/domain/script';
```

## 状态管理

**全局**: Zustand stores in `core/stores/`
**功能级**: Zustand stores in `features/*/stores/`
**组件级**: `useState` / `useReducer`
**服务端状态**: TanStack Query (待集成)

## 测试组织

```
__tests__/
├── core/                      # core 模块的测试
├── features/                  # features 模块的测试
├── services/                  # 旧版服务测试 (过渡中)
├── utils/                     # 工具测试
└── router/                    # 路由测试
```

**原则**: 测试文件与被测代码同结构,便于定位。

## 添加新 Feature

1. 在 `features/` 下创建目录
2. 实现 `components/` `services/` `stores/` `hooks/`
3. 在 `index.ts` 导出公共 API
4. 在 `app/router/page-preload.ts` 注册路由
5. 在 `__tests__/features/` 加测试

## 添加新 Page

1. 在 `pages/` 下创建目录
2. 实现 `PageName.tsx`
3. 在 `app/router/` 注册路由
4. 在 `app/components/AppLayout.tsx` 加导航

## 相关资源

- [架构设计总览](/developer-guide/architecture)
- [平台适配层](/developer-guide/platform-layer)
- [Pipeline 引擎 API](/developer-guide/pipeline-api)
- [ADR-0002: 前端分层架构](/adr/0002-frontend-monorepo-ddd.md)
