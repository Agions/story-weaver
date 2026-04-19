# 测试

PlotCraft 中的测试实践。

## 测试结构

```
tests/
├── unit/                  # 单元测试
│   ├── services/
│   ├── utils/
│   └── components/
├── integration/           # 集成测试
│   └── workflows/
└── e2e/                   # 端到端测试
    └── specs/
```

## 运行测试

```bash
# 所有测试
npm test

# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# E2E 测试
npm run test:e2e

# 监视模式
npm run test:watch

# 覆盖率
npm run test:coverage
```

## 单元测试

使用 Vitest + React Testing Library。

### 测试服务

```typescript
// tests/unit/services/ai.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { aiService } from '@/core/services';

describe('AIService', () => {
  it('应该生成内容', async () => {
    const result = await aiService.generate(
      '写一个 hello world 脚本'
    );
    
    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
  });
  
  it('应该优雅处理错误', async () => {
    // 模拟 API 失败
    vi.spyOn(aiService, 'generate').mockRejectedValueOnce(
      new Error('API 错误')
    );
    
    await expect(
      aiService.generate('test')
    ).rejects.toThrow('API 错误');
  });
});
```

### 测试组件

```typescript
// tests/unit/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/shared/components/ui/Button';

describe('Button', () => {
  it('应该渲染文本', () => {
    render(<Button>点击我</Button>);
    expect(screen.getByText('点击我')).toBeDefined();
  });
  
  it('点击时应该调用 onClick', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>点击</Button>);
    
    fireEvent.click(screen.getByText('点击'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('加载时应该禁用', () => {
    render(<Button loading>加载中</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 测试 Hooks

```typescript
// tests/unit/hooks/useDebounce.test.ts
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/shared/hooks';

describe('useDebounce', () => {
  it('应该防抖值变化', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 100 } }
    );
    
    rerender({ value: 'b', delay: 100 });
    rerender({ value: 'c', delay: 100 });
    
    // 立即执行,应该仍然是 'a'
    expect(result.current).toBe('a');
    
    // 延迟后,应该是 'c'
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });
    
    expect(result.current).toBe('c');
  });
});
```

## 集成测试

### 工作流流水线

```typescript
// tests/integration/workflows/manga-pipeline.test.ts
describe('漫画流水线', () => {
  it('应该从小说处理到视频', async () => {
    const pipeline = new MangaPipelineService();
    
    const result = await pipeline.processSequence(
      [
        {
          id: 'scene_1',
          description: '一个角色走进来',
          dialogue: '你好!',
        },
      ],
      { skipLipSync: true }
    );
    
    expect(result.status).toBe('completed');
    expect(result.videoUrl).toBeDefined();
  });
});
```

## E2E 测试

使用 Playwright 进行端到端测试。

```typescript
// tests/e2e/specs/workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('工作流', () => {
  test('应该完成完整工作流', async ({ page }) => {
    await page.goto('/');
    
    // 导入小说
    await page.click('[data-testid="import-btn"]');
    await page.fill('[data-testid="novel-input"]', '示例小说文本');
    await page.click('[data-testid="analyze-btn"]');
    
    // 生成脚本
    await page.click('[data-testid="generate-script-btn"]');
    await expect(page.locator('[data-testid="script-preview"]')).toBeVisible();
    
    // 生成分镜
    await page.click('[data-testid="generate-storyboard-btn"]');
    await expect(page.locator('[data-testid="frame-grid"]')).toBeVisible();
  });
});
```

## CI/CD 流水线

GitHub Actions 在每次 PR 时运行测试:

```yaml
# .github/workflows/test.yml
name: 测试

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: 设置 Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: 安装依赖
        run: npm ci
      
      - name: 类型检查
        run: npm run typecheck
      
      - name: 单元测试
        run: npm run test:unit -- --coverage
      
      - name: 构建
        run: npm run build
```

## 测试覆盖率

覆盖率阈值:

| 类型 | 阈值 |
|------|------|
| 语句 | 70% |
| 分支 | 65% |
| 函数 | 70% |
| 行 | 70% |

## 模拟

### API 模拟

```typescript
// tests/mocks/api.ts
export const mockApi = {
  generate: vi.fn().mockResolvedValue({
    content: '生成的文本',
    tokens: 100,
  }),
  analyze: vi.fn().mockResolvedValue({
    sentiment: 'positive',
    keywords: ['test'],
  }),
};
```

### 服务模拟

```typescript
// tests/mocks/services.ts
vi.mock('@/core/services/ai.service', () => ({
  aiService: {
    generate: vi.fn().mockResolvedValue({ content: '模拟数据' }),
    analyze: vi.fn().mockResolvedValue({ result: '已分析' }),
  },
}));
```

## 最佳实践

1. **测试行为,不测试实现**
2. **使用有意义的断言**
3. **隔离测试** - 测试之间无依赖
4. **Arrange-Act-Assert 模式**
5. **测试边界情况** - 空值、null、undefined、错误
6. **保持测试快速** - 单元测试 < 100ms
7. **描述性命名** - `it('应该验证邮箱格式')`
