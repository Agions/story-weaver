# 自主引擎 API 文档

本文档详细描述 frame-fab 全自主流水线的 API 接口设计与使用方法。

---

## 一、概述

Autonomous API 是 frame-fab 全自动漫剧制作系统的核心 API，允许开发者通过编程方式启动、管理和监控全自动流水线任务。

**基础 URL**: `/api/v1/autonomous`

**认证方式**: Bearer Token (在请求头中携带)

---

## 二、核心类型定义

### 2.1 输入类型

```typescript
// 输入模式
type InputMode = 'novel' | 'script' | 'prompt';

// 输出风格
type OutputStyle = '2d' | '3d' | 'anime' | 'realistic';

// 质量级别
type QualityLevel = 'fast' | 'balanced' | 'premium';

// 自动流水线输入
interface AutoPipelineInput {
  /** 原材料内容（小说/剧本/需求描述） */
  content: string;

  /** 输入模式 */
  mode: InputMode;

  /** 项目标题（可选） */
  title?: string;

  /** 输出风格（默认 anime） */
  style?: OutputStyle;

  /** 质量级别（默认 balanced） */
  qualityLevel?: QualityLevel;

  /** 高级选项 */
  options?: {
    /** 自审循环次数（默认 3） */
    maxReviewLoops?: number;

    /** 最大并行渲染数（默认 4） */
    maxConcurrentRenders?: number;

    /** 配音语言（默认 zh-CN） */
    language?: string;

    /** 字幕选项 */
    subtitle?: {
      enabled: boolean;
      position: 'bottom' | 'top';
    };
  };
}
```

### 2.2 输出类型

```typescript
// 流水线状态
type PipelineStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

// 步骤状态
interface StepStatus {
  stepId: string;
  stepName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress: number; // 0-100
  reviewCount: number;
  startTime?: number;
  endTime?: number;
  output?: any;
  error?: string;
}

// 自动流水线结果
interface AutoPipelineResult {
  taskId: string;
  status: PipelineStatus;
  currentStep: string;
  progress: number; // 0-100
  steps: StepStatus[];
  output?: {
    videoPath: string;
    thumbnailPath: string;
    duration: number;
    resolution: string;
    fileSize: number;
  };
  error?: {
    code: string;
    message: string;
    stepId?: string;
  };
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}
```

### 2.3 质量审核结果

```typescript
// 审核维度
interface ReviewCriteria {
  completeness?: boolean; // 完整性
  consistency?: boolean; // 一致性
  visualQuality?: boolean; // 画面感
  timing?: boolean; // 时长匹配
  climaxDetection?: boolean; // 爆点检测
}

// 审核结果
interface ReviewResult {
  passed: boolean;
  scores: Record<string, number>; // 各维度得分 0-100
  reasons: string[]; // 不合格原因
  suggestions: string[]; // 修复建议
}
```

---

## 三、REST API 接口

### 3.1 创建任务

**POST** `/api/v1/autonomous/tasks`

创建新的全自动流水线任务。

**请求体**:

```json
{
  "content": "小说文本内容...",
  "mode": "novel",
  "title": "我的漫剧项目",
  "style": "anime",
  "qualityLevel": "balanced",
  "options": {
    "maxReviewLoops": 3,
    "maxConcurrentRenders": 4,
    "language": "zh-CN",
    "subtitle": {
      "enabled": true,
      "position": "bottom"
    }
  }
}
```

**响应** (201 Created):

```json
{
  "taskId": "task_abc123xyz",
  "status": "running",
  "currentStep": "ImportStep",
  "progress": 0,
  "createdAt": 1747987200000
}
```

**错误响应**:

| 状态码 | 错误码            | 说明                    |
| ------ | ----------------- | ----------------------- |
| 400    | INVALID_INPUT     | 输入内容无效或格式错误  |
| 400    | CONTENT_TOO_SHORT | 内容过短（少于 100 字） |
| 401    | UNAUTHORIZED      | 未提供或无效的认证令牌  |
| 429    | RATE_LIMITED      | 请求过于频繁            |
| 500    | INTERNAL_ERROR    | 服务器内部错误          |

### 3.2 获取任务状态

**GET** `/api/v1/autonomous/tasks/{taskId}`

获取指定任务的详细状态信息。

**路径参数**:

| 参数   | 类型   | 说明    |
| ------ | ------ | ------- |
| taskId | string | 任务 ID |

**响应** (200 OK):

```json
{
  "taskId": "task_abc123xyz",
  "status": "running",
  "currentStep": "StoryboardStep",
  "progress": 45,
  "steps": [
    {
      "stepId": "import",
      "stepName": "ImportStep",
      "status": "completed",
      "progress": 100,
      "reviewCount": 1,
      "startTime": 1747987200000,
      "endTime": 1747987205000
    },
    {
      "stepId": "analysis",
      "stepName": "AnalysisStep",
      "status": "completed",
      "progress": 100,
      "reviewCount": 1,
      "startTime": 1747987205000,
      "endTime": 1747987220000
    },
    {
      "stepId": "script",
      "stepName": "ScriptStep",
      "status": "completed",
      "progress": 100,
      "reviewCount": 2,
      "startTime": 1747987220000,
      "endTime": 1747987250000
    },
    {
      "stepId": "character",
      "stepName": "CharacterStep",
      "status": "running",
      "progress": 60,
      "reviewCount": 1,
      "startTime": 1747987250000
    }
  ],
  "createdAt": 1747987200000,
  "updatedAt": 1747987260000
}
```

**错误响应**:

| 状态码 | 错误码         | 说明       |
| ------ | -------------- | ---------- |
| 404    | TASK_NOT_FOUND | 任务不存在 |

### 3.3 获取任务进度（WebSocket 推荐）

**GET** `/api/v1/autonomous/tasks/{taskId}/progress`

获取任务的实时进度信息。

**响应** (200 OK):

```json
{
  "taskId": "task_abc123xyz",
  "progress": 45,
  "currentStep": {
    "id": "character",
    "name": "CharacterStep",
    "progress": 60,
    "reviewLoop": {
      "current": 1,
      "max": 3
    }
  },
  "estimatedTimeRemaining": 300000,
  "lastUpdated": 1747987260000
}
```

### 3.4 暂停任务

**POST** `/api/v1/autonomous/tasks/{taskId}/pause`

暂停正在运行的任务。

**响应** (200 OK):

```json
{
  "taskId": "task_abc123xyz",
  "status": "paused",
  "pausedAt": 1747987260000,
  "checkpoint": {
    "stepId": "character",
    "stepProgress": 60,
    "data": { ... }
  }
}
```

**错误响应**:

| 状态码 | 错误码         | 说明                     |
| ------ | -------------- | ------------------------ |
| 400    | INVALID_STATE  | 任务无法暂停（如已完成） |
| 404    | TASK_NOT_FOUND | 任务不存在               |

### 3.5 恢复任务

**POST** `/api/v1/autonomous/tasks/{taskId}/resume`

恢复已暂停的任务。

**响应** (200 OK):

```json
{
  "taskId": "task_abc123xyz",
  "status": "running",
  "resumedAt": 1747987300000
}
```

**错误响应**:

| 状态码 | 错误码         | 说明                     |
| ------ | -------------- | ------------------------ |
| 400    | INVALID_STATE  | 任务无法恢复（如未暂停） |
| 404    | TASK_NOT_FOUND | 任务不存在               |

### 3.6 取消任务

**POST** `/api/v1/autonomous/tasks/{taskId}/cancel`

取消正在运行或暂停的任务。

**响应** (200 OK):

```json
{
  "taskId": "task_abc123xyz",
  "status": "cancelled",
  "cancelledAt": 1747987300000
}
```

### 3.7 获取任务输出

**GET** `/api/v1/autonomous/tasks/{taskId}/output`

获取已完成任务的输出结果。

**响应** (200 OK):

```json
{
  "taskId": "task_abc123xyz",
  "status": "completed",
  "output": {
    "videoPath": "/output/task_abc123xyz/final.mp4",
    "thumbnailPath": "/output/task_abc123xyz/thumbnail.jpg",
    "duration": 1200,
    "resolution": "1920x1080",
    "fileSize": 52428800,
    "format": "mp4"
  },
  "completedAt": 1747987400000
}
```

**错误响应**:

| 状态码 | 错误码           | 说明         |
| ------ | ---------------- | ------------ |
| 404    | TASK_NOT_FOUND   | 任务不存在   |
| 400    | OUTPUT_NOT_READY | 输出尚未生成 |

### 3.8 下载输出文件

**GET** `/api/v1/autonomous/tasks/{taskId}/download`

下载任务的输出文件（视频、缩略图等）。

**查询参数**:

| 参数 | 类型   | 说明                                               |
| ---- | ------ | -------------------------------------------------- |
| type | string | 下载类型：`video`（默认）、`thumbnail`、`subtitle` |

**响应**: 文件流

### 3.9 列举任务

**GET** `/api/v1/autonomous/tasks`

列举当前用户的所有任务。

**查询参数**:

| 参数      | 类型   | 默认值    | 说明       |
| --------- | ------ | --------- | ---------- |
| page      | number | 1         | 页码       |
| limit     | number | 20        | 每页数量   |
| status    | string | -         | 按状态筛选 |
| sortBy    | string | createdAt | 排序字段   |
| sortOrder | string | desc      | 排序方向   |

**响应** (200 OK):

```json
{
  "tasks": [
    {
      "taskId": "task_abc123xyz",
      "title": "我的漫剧项目",
      "status": "completed",
      "progress": 100,
      "createdAt": 1747987200000,
      "completedAt": 1747987400000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### 3.10 删除任务

**DELETE** `/api/v1/autonomous/tasks/{taskId}`

删除指定的任务及其相关文件。

**响应** (204 No Content)

---

## 四、WebSocket 接口

### 4.1 连接

**WebSocket** `/api/v1/autonomous/ws`

实时接收任务进度更新。

**认证**: 在连接 URL 中携带 `?token=xxx` 或在连接后发送 auth 消息

**客户端消息**:

```json
{
  "type": "subscribe",
  "taskId": "task_abc123xyz"
}
```

**服务端消息**:

```json
{
  "type": "progress",
  "taskId": "task_abc123xyz",
  "data": {
    "status": "running",
    "currentStep": "CharacterStep",
    "progress": 45,
    "stepProgress": 60
  }
}
```

**消息类型**:

| 类型            | 说明         |
| --------------- | ------------ |
| `progress`      | 进度更新     |
| `step_start`    | 步骤开始     |
| `step_complete` | 步骤完成     |
| `step_error`    | 步骤错误     |
| `review_loop`   | 自审循环触发 |
| `quality_gate`  | 质量门禁判定 |
| `completed`     | 任务完成     |
| `error`         | 任务错误     |

---

## 五、JavaScript SDK

### 5.1 安装

```bash
npm install @frame-fab/autonomous-sdk
```

### 5.2 初始化

```typescript
import { AutonomousClient } from '@frame-fab/autonomous-sdk';

const client = new AutonomousClient({
  baseUrl: 'https://api.frame-fab.com',
  token: 'your_api_token',
  // 可选：WebSocket 连接选项
  wsOptions: {
    reconnect: true,
    maxRetries: 5,
  },
});
```

### 5.3 创建并启动任务

```typescript
import { AutonomousClient, InputMode, OutputStyle, QualityLevel } from '@frame-fab/autonomous-sdk';

const client = new AutonomousClient({
  baseUrl: 'https://api.frame-fab.com',
  token: 'your_api_token',
});

// 创建任务
const task = await client.tasks.create({
  content: novelText,
  mode: InputMode.NOVEL,
  title: '我的漫剧项目',
  style: OutputStyle.ANIME,
  qualityLevel: QualityLevel.BALANCED,
  options: {
    maxReviewLoops: 3,
    maxConcurrentRenders: 4,
    subtitle: {
      enabled: true,
      position: 'bottom',
    },
  },
});

console.log(`任务已创建: ${task.taskId}`);
```

### 5.4 监控任务进度

**方式一：轮询**

```typescript
async function monitorTask(taskId: string) {
  while (true) {
    const status = await client.tasks.getStatus(taskId);

    console.log(`进度: ${status.progress}%`);
    console.log(`当前步骤: ${status.currentStep}`);

    if (status.status === 'completed') {
      console.log('任务完成!');
      console.log('输出文件:', status.output.videoPath);
      break;
    }

    if (status.status === 'failed') {
      console.error('任务失败:', status.error);
      break;
    }

    await sleep(5000); // 每 5 秒查询一次
  }
}
```

**方式二：WebSocket 实时监听**

```typescript
const ws = await client.tasks.subscribeToTask(taskId);

// 监听进度更新
ws.on('progress', (data) => {
  console.log(`进度: ${data.progress}%`);
});

// 监听步骤完成
ws.on('step_complete', (data) => {
  console.log(`步骤完成: ${data.stepName}`);
});

// 监听自审循环
ws.on('review_loop', (data) => {
  console.log(`自审循环: ${data.current}/${data.max}`);
});

// 监听任务完成
ws.on('completed', (data) => {
  console.log('任务完成!');
  console.log('视频路径:', data.output.videoPath);
});

// 监听错误
ws.on('error', (data) => {
  console.error('任务错误:', data.message);
});
```

### 5.5 暂停/恢复/取消

```typescript
// 暂停任务
await client.tasks.pause(taskId);

// 恢复任务
await client.tasks.resume(taskId);

// 取消任务
await client.tasks.cancel(taskId);
```

### 5.6 获取输出并下载

```typescript
// 获取输出信息
const output = await client.tasks.getOutput(taskId);

console.log('视频时长:', output.duration, '秒');
console.log('分辨率:', output.resolution);
console.log('文件大小:', (output.fileSize / 1024 / 1024).toFixed(2), 'MB');

// 下载视频
const videoBlob = await client.tasks.download(taskId, { type: 'video' });
const url = URL.createObjectURL(videoBlob);

// 或者获取下载链接
const downloadUrl = await client.tasks.getDownloadUrl(taskId, { type: 'video' });
```

### 5.7 列举任务

```typescript
const result = await client.tasks.list({
  page: 1,
  limit: 20,
  status: 'completed',
});

console.log(`共 ${result.pagination.total} 个任务`);
result.tasks.forEach((task) => {
  console.log(`- ${task.title} [${task.status}]`);
});
```

---

## 六、错误处理

### 6.1 错误响应格式

```typescript
interface APIError {
  code: string; // 错误码
  message: string; // 错误消息
  details?: any; // 详细信息
  requestId: string; // 请求 ID（用于排查）
}
```

### 6.2 常见错误码

| 错误码              | HTTP 状态 | 说明                 |
| ------------------- | --------- | -------------------- |
| INVALID_INPUT       | 400       | 输入参数无效         |
| CONTENT_TOO_SHORT   | 400       | 内容过短             |
| TASK_NOT_FOUND      | 404       | 任务不存在           |
| INVALID_STATE       | 400       | 任务状态不允许此操作 |
| RATE_LIMITED        | 429       | 请求频率超限         |
| UNAUTHORIZED        | 401       | 未授权               |
| INTERNAL_ERROR      | 500       | 服务器内部错误       |
| SERVICE_UNAVAILABLE | 503       | 服务不可用（降级中） |

### 6.3 SDK 错误处理示例

```typescript
import { AutonomousClient, APIError, RateLimitError, TaskNotFoundError } from '@frame-fab/autonomous-sdk';

const client = new AutonomousClient({ ... });

try {
  const task = await client.tasks.create({ ... });
} catch (error) {
  if (error instanceof RateLimitError) {
    // 请求频率超限，等待后重试
    console.log(`限流，等待 ${error.retryAfter} 秒...`);
    await sleep(error.retryAfter * 1000);
    // 重试...
  } else if (error instanceof APIError) {
    // API 错误
    console.error(`API 错误 [${error.code}]: ${error.message}`);
  } else {
    // 其他错误
    throw error;
  }
}
```

---

## 七、速率限制

| 端点            | 限制         |
| --------------- | ------------ |
| POST /tasks     | 10 次/分钟   |
| GET /tasks/{id} | 60 次/分钟   |
| WebSocket 连接  | 5 个并发连接 |

---

## 八、Webhook（企业版）

企业版用户可以配置 Webhook 接收任务状态更新。

**配置方式**:

```typescript
await client.webhooks.configure({
  url: 'https://your-server.com/webhooks/frame-fab',
  events: ['task.completed', 'task.failed', 'step.completed'],
  secret: 'your_webhook_secret',
});
```

**Webhook payload**:

```json
{
  "event": "task.completed",
  "timestamp": 1747987400000,
  "taskId": "task_abc123xyz",
  "data": {
    "status": "completed",
    "output": { ... }
  },
  "signature": "sha256=..."
}
```
