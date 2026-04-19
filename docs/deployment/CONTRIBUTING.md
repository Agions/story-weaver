# 为 PlotCraft 做贡献

感谢您对 PlotCraft 贡献的兴趣！本指南涵盖如何参与其中。

## 贡献方式

- **问题报告** - 在 [GitHub Issues](https://github.com/Agions/PlotCraft/issues) 报告问题
- **功能请求** - 提出新功能建议
- **代码贡献** - 提交拉取请求
- **文档改进** - 改进文档
- **测试** - 测试新功能并报告问题

## 开发环境设置

### 前置要求

- Node.js 18+
- npm 9+ 或 pnpm 8+
- Git

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/Agions/PlotCraft.git
cd PlotCraft

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 环境设置

```bash
# 创建 .env.local 用于开发
cp .env.example .env.local

# 编辑并添加您的 API 密钥
VITE_ALIBABA_API_KEY=***
```

## 项目结构

```
PlotCraft/
├── src/
│   ├── app/              # 应用入口
│   ├── pages/            # 路由页面
│   ├── features/         # 领域模块
│   ├── shared/          # 共享基础设施
│   ├── core/            # 核心服务
│   └── styles/          # 全局样式
├── docs/                # 文档
├── tests/               # 测试文件
└── public/              # 静态资源
```

## 代码规范

### TypeScript

- 所有新代码使用 TypeScript
- 为 props 和 state 定义proper类型
- 避免使用 `any` 类型

```typescript
// 好的示例
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

// 应避免的示例
interface ButtonProps {
  variant: any;
  onClick: Function;
}
```

### 命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| 组件 | PascalCase | `WorkflowEditor.tsx` |
| Hooks | camelCase，使用前缀 | `useWorkflow.ts` |
| 服务 | camelCase | `workflow.service.ts` |
| 类型 | PascalCase | `WorkflowState` |
| 常量 | SCREAMING_SNAKE | `MAX_FILE_SIZE` |

### 文件组织

```
features/[name]/
├── components/
│   └── FeatureName.tsx
├── hooks/
│   └── useFeatureName.ts
├── services/
│   └── feature.service.ts
├── types/
│   └── types.ts
└── index.ts              # 公共导出
```

## 提交信息

遵循 [Conventional Commits](https://www.conventionalcommits.org) 规范：

```
feat: add new storyboard generation feature
fix: resolve image export timeout issue
docs: update API documentation
refactor: simplify workflow executor
test: add unit tests for AIService
chore: update dependencies
```

## 拉取请求

### 提交前

1. Fork 仓库
2. 创建功能分支
3. 进行修改
4. 添加测试
5. 确保所有测试通过
6. 如需要更新文档

### PR 模板

```markdown
## 描述
简要描述变更内容

## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 破坏性变更
- [ ] 文档更新

## 测试
描述执行的测试

## 截图（如有 UI 变更）

## 检查清单
- [ ] 代码符合样式指南
- [ ] 已自我审查
- [ ] 已添加/更新测试
- [ ] 已更新文档
```

## 测试指南

```bash
# 运行所有测试
npm test

# 带覆盖率运行
npm run test:coverage

# 运行特定测试文件
npm test -- src/features/workflow/__tests__

# 监视模式运行
npm run test:watch
```

### 测试结构

```typescript
describe('FeatureName', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = doSomething(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

## 报告问题

### 问题报告模板

```markdown
**描述**
清晰的bug描述

**复现步骤**
1. 进入 '...'
2. 点击 '...'
3. 看到错误

**预期行为**
应该发生什么

**实际行为**
实际发生了什么

**环境**
- 操作系统: [例如 macOS 14.0]
- 浏览器: [例如 Chrome 120]
- 版本: [例如 3.0.0]

**额外上下文**
截图、错误日志等
```

## 功能建议

### 功能请求模板

```markdown
**您的功能请求与什么问题相关？**
问题描述

**描述您想要的解决方案**
详细描述

**描述考虑过的替代方案**
替代解决方案

**额外上下文**
模型、原型等
```

## 代码审查流程

1. 自动化检查必须通过（CI/CD）
2. 至少需要一名维护者审查
3. 处理审查反馈
4. 如需要则压缩提交

## 许可证

通过贡献，您同意您的贡献将遵循 MIT 许可证。

## 问题？

- GitHub Discussions: https://github.com/Agions/PlotCraft/discussions
- Issues: https://github.com/Agions/PlotCraft/issues
