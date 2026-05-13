# 项目结构

panel-flow 的详细文件组织。

## 根目录结构

```
PanelFlow/
├── .github/                    # GitHub 工作流和模板
│   ├── workflows/            # CI/CD 流水线
│   ├── ISSUES_TEMPLATE/       # Issue 模板
│   └── PULL_REQUEST_TEMPLATE.md
├── public/                     # 静态资源
├── src/                        # 源代码
├── src-tauri/                  # Tauri 桌面端（Rust）
├── docs/                       # VitePress 文档
├── scripts/                    # 构建脚本
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 源代码结构 (`src/`)

```
src/
├── App.tsx                   # 根组件
├── main.tsx                  # 入口文件
├── ErrorBoundary.tsx         # 错误边界
│
├── pages/                    # 路由级页面
│   ├── HomePage.tsx
│   ├── ProjectEditPage.tsx
│   └── SettingsPage.tsx
│
├── components/               # 业务组件
│   ├── ui/                   # 基础 UI 组件
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Select.tsx
│   │   └── ...
│   ├── layout/               # 布局组件
│   │   └── AppLayout/
│   └── business/             # 业务组件
│       ├── CostDashboard/
│       └── CompositionStudio/
│
├── features/                 # 功能模块 (DDD)
│   ├── workflow/
│   │   ├── components/      # WorkflowEditor, NodePalette, NodeConfig
│   │   ├── hooks/
│   │   └── services/
│   ├── storyboard/          # 分镜编辑
│   ├── character/           # 角色管理
│   ├── script/              # 脚本生成
│   ├── video/               # 视频播放/导出
│   └── ...
│
├── shared/                   # 共享基础设施
│   ├── components/ui/       # 可复用 UI 组件
│   ├── hooks/               # useDebounce, useLocalStorage 等
│   ├── services/            # API 客户端、存储抽象
│   ├── stores/              # Zustand 状态存储
│   ├── types/               # 共享类型
│   └── utils/               # formatTime, debounce 等
│
└── core/                     # 核心服务
    ├── config/              # 应用配置
    ├── pipeline/            # 流水线引擎
    └── services/            # AI、TTS、图像生成等 30+ 服务
```

## 功能模块模式

每个功能遵循此结构：

```
features/[名称]/
├── components/
│   └── FeatureName.tsx      # 主组件
├── hooks/
│   └── useFeatureName.ts    # 自定义 Hooks
├── services/
│   └── feature.service.ts    # 业务逻辑
├── types/
│   └── types.ts              # 功能特定类型
└── index.ts                  # 公开 API (桶导出)
```

## 命名规范

| 类型     | 规范                      | 示例                  |
| -------- | ------------------------- | --------------------- |
| 组件     | PascalCase                | `WorkflowEditor.tsx`  |
| Hooks    | camelCase 带 `use` 前缀   | `useWorkflow.ts`      |
| 服务     | camelCase                 | `workflow.service.ts` |
| 类型     | PascalCase                | `WorkflowState.ts`    |
| 存储     | camelCase 带 `store` 后缀 | `workflowStore.ts`    |
| 工具函数 | camelCase                 | `formatDate.ts`       |
| 常量     | SCREAMING_SNAKE           | `MAX_FILE_SIZE`       |

## 导入路径

```typescript
// 绝对导入（@/ 别名）
import { Button } from '@/shared/components/ui/Button';
import { workflowService } from '@/features/workflow';
import type { StoryboardFrame } from '@/shared/types';

// 相对导入（用于近邻文件）
import { useState } from 'react';
import './styles.css';
```

## 关键文件

| 文件                      | 用途             |
| ------------------------- | ---------------- |
| `src/App.tsx`             | 根组件，路由配置 |
| `src/main.tsx`            | 入口文件         |
| `src/shared/stores/*.ts`  | Zustand 状态存储 |
| `src/core/services/*.ts`  | 核心服务实现     |
| `src/features/*/index.ts` | 功能公开 API     |
