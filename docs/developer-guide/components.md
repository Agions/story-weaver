# 组件

PlotCraft 中的可复用 UI 组件。

## 组件架构

```
shared/components/
├── ui/                    # 基础 UI 组件 (无头组件)
│   ├── Button/
│   ├── Input/
│   ├── Select/
│   ├── Modal/
│   ├── Dropdown/
│   └── ...
│
├── layout/                # 布局组件
│   ├── AppLayout/
│   ├── PageHeader/
│   ├── Sidebar/
│   └── ...
│
├── common/                # 领域无关的通用组件
│   ├── FileUpload/
│   ├── ImagePreview/
│   ├── ProgressBar/
│   └── ...
│
└── icons/                 # 图标组件
    └── Icon.tsx
```

## 基础 UI 组件

基于 shadcn/ui (Radix UI + Tailwind CSS) 构建,保持一致性。

### Button

```typescript
import { Button } from '@/shared/components/ui/Button';

// 变体
<Button variant="primary">主要</Button>
<Button variant="secondary">次要</Button>
<Button variant="ghost">幽灵</Button>
<Button variant="danger">危险</Button>

// 尺寸
<Button size="sm">小</Button>
<Button size="md">中</Button>
<Button size="lg">大</Button>

// 状态
<Button loading>加载中</Button>
<Button disabled>禁用</Button>
```

### Input

```typescript
import { Input } from '@/shared/components/ui/Input';

<Input placeholder="输入文本..." />
<Input.TextArea rows={4} />
<Input.Password />
```

### Modal

```typescript
import { Modal } from '@/shared/components/ui/Modal';

<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="弹窗标题"
>
  弹窗内容
</Modal>
```

## 布局组件

### AppLayout

带侧边栏的主应用布局。

```typescript
import { AppLayout } from '@/shared/components/layout/AppLayout';

<AppLayout
  sidebar={<Navigation />}
  header={<Header />}
>
  <PageContent />
</AppLayout>
```

### PageHeader

统一的页面头部。

```typescript
import { PageHeader } from '@/shared/components/layout/PageHeader';

<PageHeader
  title="页面标题"
  subtitle="页面描述"
  breadcrumb={['首页', '页面']}
  actions={<Button>操作</Button>}
/>
```

## 通用组件

### FileUpload

拖拽文件上传。

```typescript
import { FileUpload } from '@/shared/components/common/FileUpload';

<FileUpload
  accept=".txt,.md"
  maxSize={10 * 1024 * 1024}
  onUpload={(file) => handleFile(file)}
/>
```

### ProgressBar

线性或圆形进度指示器。

```typescript
import { ProgressBar } from '@/shared/components/common/ProgressBar';

<ProgressBar percent={75} />
<ProgressBar type="circular" percent={50} />
```

## 功能组件

功能特定组件位于 `features/[名称]/components/`。

### 工作流组件

```
features/workflow/components/
├── WorkflowEditor.tsx      # 主工作流画布
├── NodePalette.tsx         # 可用节点侧边栏
├── NodeConfig.tsx          # 节点配置面板
├── ConnectionLine.tsx      # SVG 连接线
└── MiniMap.tsx             # 导航小地图
```

### 分镜组件

```
features/storyboard/components/
├── StoryboardEditor.tsx    # 主分镜编辑器
├── FrameGrid.tsx           # 帧缩略图网格
├── FrameEditor.tsx         # 单帧编辑器
└── FramePreview.tsx        # 帧图片预览
```

## 组件模式

### 复合组件

```typescript
// Modal 是一个复合组件
<Modal open={true} onClose={handleClose}>
  <Modal.Header>标题</Modal.Header>
  <Modal.Body>内容</Modal.Body>
  <Modal.Footer>
    <Button>取消</Button>
    <Button type="primary">确认</Button>
  </Modal.Footer>
</Modal>
```

### 受控/非受控

```typescript
// 受控
const [value, setValue] = useState('');
<Input value={value} onChange={(e) => setValue(e.target.value)} />

// 非受控 (内部状态)
<Input defaultValue="初始值" />
```

## 样式

组件使用 Tailwind CSS 配合 shadcn/ui 设计令牌。

```typescript
// Component.module.less
.container {
  padding: 16px;
  background: var(--color-bg);
  
  .title {
    font-size: 18px;
    font-weight: 600;
  }
}
```

## 最佳实践

1. **组合优于继承**
2. **单一职责** - 每个组件做好一件事
3. **Props 类型** - 始终定义 PropTypes 或 TypeScript 接口
4. **记忆化** - 昂贵渲染使用 `React.memo()`
5. **可访问性** - 包含 ARIA 属性和键盘导航
