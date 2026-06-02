# API 文档

本文档提供 FrameForge 完整的 REST API 接口参考。

---

## 一、概述

**基础 URL**: `https://api.frameforge.com/api/v1`

**认证方式**: 所有 API 请求需要在 Header 中携带 Bearer Token：

```
Authorization: Bearer <your_api_token>
```

**内容类型**: 所有请求和响应的 Content-Type 为 `application/json`

**速率限制**: 默认情况下，API 速率限制为 100 请求/分钟

---

## 二、认证

### 2.1 获取 Access Token

**POST** `/api/v1/auth/token`

获取 API 访问令牌。

**请求体**:

```json
{
  "apiKey": "your_api_key",
  "apiSecret": "your_api_secret"
}
```

**响应** (200 OK):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "refreshToken": "def502003..."
}
```

### 2.2 刷新 Token

**POST** `/api/v1/auth/refresh`

刷新访问令牌。

**请求体**:

```json
{
  "refreshToken": "def502003..."
}
```

---

## 三、任务管理

### 3.1 创建任务

**POST** `/api/v1/tasks`

创建新的漫剧制作任务。

**请求体**:

```typescript
interface CreateTaskRequest {
  /** 任务标题 */
  title?: string;

  /** 输入模式: novel | script | prompt */
  mode: 'novel' | 'script' | 'prompt';

  /** 原材料内容 */
  content: string;

  /** 输出风格: anime | 2d | 3d | realistic */
  style?: 'anime' | '2d' | '3d' | 'realistic';

  /** 质量级别: fast | balanced | premium */
  qualityLevel?: 'fast' | 'balanced' | 'premium';

  /** 运行模式: manual | autonomous */
  runMode?: 'manual' | 'autonomous';
}
```

**示例**:

```bash
curl -X POST https://api.frameforge.com/api/v1/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的第一个漫剧",
    "mode": "novel",
    "content": "小说内容...",
    "style": "anime",
    "qualityLevel": "balanced",
    "runMode": "autonomous"
  }'
```

**响应** (201 Created):

```json
{
  "taskId": "task_abc123xyz",
  "title": "我的第一个漫剧",
  "status": "idle",
  "mode": "novel",
  "style": "anime",
  "qualityLevel": "balanced",
  "runMode": "autonomous",
  "createdAt": 1747987200000
}
```

### 3.2 获取任务列表

**GET** `/api/v1/tasks`

获取当前用户的所有任务。

**查询参数**:

| 参数      | 类型   | 默认值    | 说明                 |
| --------- | ------ | --------- | -------------------- |
| page      | number | 1         | 页码                 |
| limit     | number | 20        | 每页数量（最大 100） |
| status    | string | -         | 按状态筛选           |
| mode      | string | -         | 按模式筛选           |
| sortBy    | string | createdAt | 排序字段             |
| sortOrder | string | desc      | 升序/降序            |

**响应** (200 OK):

```json
{
  "tasks": [
    {
      "taskId": "task_abc123xyz",
      "title": "我的第一个漫剧",
      "status": "completed",
      "mode": "novel",
      "style": "anime",
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

### 3.3 获取任务详情

**GET** `/api/v1/tasks/{taskId}`

获取指定任务的详细信息。

**路径参数**:

| 参数   | 类型   | 说明    |
| ------ | ------ | ------- |
| taskId | string | 任务 ID |

**响应** (200 OK):

```json
{
  "taskId": "task_abc123xyz",
  "title": "我的第一个漫剧",
  "status": "running",
  "mode": "novel",
  "style": "anime",
  "qualityLevel": "balanced",
  "currentStep": "StoryboardStep",
  "progress": 45,
  "steps": [
    {
      "stepId": "import",
      "stepName": "ImportStep",
      "status": "completed",
      "progress": 100,
      "duration": 5000
    },
    {
      "stepId": "analysis",
      "stepName": "AnalysisStep",
      "status": "completed",
      "progress": 100,
      "duration": 15000
    },
    {
      "stepId": "script",
      "stepName": "ScriptStep",
      "status": "completed",
      "progress": 100,
      "reviewCount": 1,
      "duration": 30000
    },
    {
      "stepId": "character",
      "stepName": "CharacterStep",
      "status": "running",
      "progress": 60
    }
  ],
  "output": null,
  "error": null,
  "createdAt": 1747987200000,
  "updatedAt": 1747987260000
}
```

### 3.4 更新任务

**PATCH** `/api/v1/tasks/{taskId}`

更新任务信息（仅限 idle 状态）。

**请求体**:

```json
{
  "title": "新标题",
  "style": "3d"
}
```

### 3.5 删除任务

**DELETE** `/api/v1/tasks/{taskId}`

删除指定任务及其所有关联文件。

**响应** (204 No Content)

### 3.6 启动任务

**POST** `/api/v1/tasks/{taskId}/start`

启动任务执行。

**响应** (200 OK):

```json
{
  "taskId": "task_abc123xyz",
  "status": "running",
  "startedAt": 1747987200000
}
```

### 3.7 暂停任务

**POST** `/api/v1/tasks/{taskId}/pause`

暂停正在运行的任务。

**响应** (200 OK):

```json
{
  "taskId": "task_abc123xyz",
  "status": "paused",
  "pausedAt": 1747987260000
}
```

### 3.8 恢复任务

**POST** `/api/v1/tasks/{taskId}/resume`

恢复已暂停的任务。

**响应** (200 OK):

```json
{
  "taskId": "task_abc123xyz",
  "status": "running",
  "resumedAt": 1747987300000
}
```

### 3.9 取消任务

**POST** `/api/v1/tasks/{taskId}/cancel`

取消正在运行或暂停的任务。

**响应** (200 OK):

```json
{
  "taskId": "task_abc123xyz",
  "status": "cancelled",
  "cancelledAt": 1747987300000
}
```

---

## 四、手动模式步骤控制

### 4.1 获取步骤详情

**GET** `/api/v1/tasks/{taskId}/steps/{stepId}`

获取任务中指定步骤的详细信息。

**响应** (200 OK):

```json
{
  "stepId": "script",
  "stepName": "ScriptStep",
  "status": "completed",
  "progress": 100,
  "input": {
    "analysisResult": { ... }
  },
  "output": {
    "scenes": [ ... ],
    "dialogues": [ ... ],
    "duration": 1200
  },
  "reviewLoop": {
    "count": 1,
    "max": 3,
    "lastReviewResult": { ... }
  },
  "startedAt": 1747987220000,
  "completedAt": 1747987250000
}
```

### 4.2 执行步骤

**POST** `/api/v1/tasks/{taskId}/steps/{stepId}/execute`

手动执行指定步骤（仅限 manual 模式）。

**请求体**:

```json
{
  "input": {
    // 步骤所需的输入数据
  }
}
```

### 4.3 更新步骤输出

**PATCH** `/api/v1/tasks/{taskId}/steps/{stepId}/output`

更新步骤的输出数据（用于手动编辑）。

**请求体**:

```json
{
  "scenes": [ ... ],
  "dialogues": [ ... ]
}
```

### 4.4 提交步骤审核

**POST** `/api/v1/tasks/{taskId}/steps/{stepId}/submit`

提交步骤输出进行质量审核。

**响应** (200 OK):

```json
{
  "stepId": "script",
  "reviewResult": {
    "passed": true,
    "scores": {
      "completeness": 95,
      "consistency": 90,
      "visualQuality": 88
    },
    "reasons": [],
    "suggestions": []
  }
}
```

---

## 五、角色管理

### 5.1 获取角色列表

**GET** `/api/v1/tasks/{taskId}/characters`

获取任务中的所有角色。

**响应** (200 OK):

```json
{
  "characters": [
    {
      "characterId": "char_001",
      "name": "小明",
      "description": "主角，一个勇敢的少年",
      "appearance": {
        "age": "16-18",
        "hair": "黑色短发",
        "eyes": "棕色",
        "build": "中等身材"
      },
      "images": ["/output/task_abc123xyz/characters/char_001_1.png"],
      "consistency": 95
    }
  ]
}
```

### 5.2 创建角色

**POST** `/api/v1/tasks/{taskId}/characters`

为任务创建新角色。

**请求体**:

```json
{
  "name": "小明",
  "description": "主角，一个勇敢的少年",
  "appearance": {
    "age": "16-18",
    "hair": "黑色短发",
    "eyes": "棕色"
  }
}
```

### 5.3 更新角色

**PATCH** `/api/v1/tasks/{taskId}/characters/{characterId}`

更新角色信息。

### 5.4 删除角色

**DELETE** `/api/v1/tasks/{taskId}/characters/{characterId}`

删除角色。

### 5.5 重新生成角色图

**POST** `/api/v1/tasks/{taskId}/characters/{characterId}/regenerate`

重新生成角色的参考图。

**请求体**:

```json
{
  "prompt": "正面站姿，开心表情",
  "style": "anime"
}
```

---

## 六、分镜管理

### 6.1 获取分镜列表

**GET** `/api/v1/tasks/{taskId}/storyboards`

获取任务中的所有分镜。

**响应** (200 OK):

```json
{
  "storyboards": [
    {
      "storyboardId": "sb_001",
      "sceneNumber": 1,
      "sceneName": "教室",
      "description": "小明走进教室，看到朋友们在讨论什么",
      "cameraAngle": "medium_shot",
      "background": "教室内景",
      "characters": ["char_001", "char_002"],
      "dialogue": {
        "characterId": "char_001",
        "text": "大家早上好！"
      },
      "duration": 5,
      "imagePath": "/output/task_abc123xyz/storyboards/sb_001.png",
      "status": "completed"
    }
  ]
}
```

### 6.2 更新分镜

**PATCH** `/api/v1/tasks/{taskId}/storyboards/{storyboardId}`

更新分镜信息。

**请求体**:

```json
{
  "description": "新的描述",
  "cameraAngle": "close_up",
  "duration": 3
}
```

### 6.3 重新生成分镜图

**POST** `/api/v1/tasks/{taskId}/storyboards/{storyboardId}/regenerate`

重新生成分镜参考图。

---

## 七、渲染任务

### 7.1 提交渲染任务

**POST** `/api/v1/tasks/{taskId}/render`

为分镜提交渲染任务。

**请求体**:

```json
{
  "storyboardIds": ["sb_001", "sb_002", "sb_003"],
  "quality": "high",
  "parallelism": 4
}
```

**响应** (202 Accepted):

```json
{
  "renderJobId": "render_job_xyz",
  "status": "queued",
  "totalFrames": 30,
  "estimatedTime": 300000
}
```

### 7.2 获取渲染状态

**GET** `/api/v1/tasks/{taskId}/render/{renderJobId}`

获取渲染任务状态。

**响应** (200 OK):

```json
{
  "renderJobId": "render_job_xyz",
  "status": "running",
  "progress": 65,
  "completedFrames": 19,
  "totalFrames": 30,
  "failedFrames": 0,
  "startedAt": 1747987200000,
  "estimatedCompletion": 1747987500000
}
```

### 7.3 取消渲染任务

**POST** `/api/v1/tasks/{taskId}/render/{renderJobId}/cancel`

取消渲染任务。

---

## 八、输出管理

### 8.1 获取输出信息

**GET** `/api/v1/tasks/{taskId}/output`

获取任务的最终输出信息。

**响应** (200 OK):

```json
{
  "taskId": "task_abc123xyz",
  "status": "completed",
  "output": {
    "video": {
      "path": "/output/task_abc123xyz/final.mp4",
      "format": "mp4",
      "codec": "h264",
      "resolution": "1920x1080",
      "duration": 1200,
      "fileSize": 52428800,
      "bitrate": 350000
    },
    "thumbnail": {
      "path": "/output/task_abc123xyz/thumbnail.jpg",
      "resolution": "640x360"
    },
    "subtitles": {
      "path": "/output/task_abc123xyz/subtitles.srt",
      "language": "zh-CN"
    },
    "audio": {
      "path": "/output/task_abc123xyz/audio.m3u8"
    }
  },
  "completedAt": 1747987400000
}
```

### 8.2 下载输出文件

**GET** `/api/v1/tasks/{taskId}/download`

下载任务输出文件。

**查询参数**:

| 参数    | 类型   | 默认值   | 说明                                                |
| ------- | ------ | -------- | --------------------------------------------------- |
| type    | string | video    | 文件类型：`video`、`thumbnail`、`subtitle`、`audio` |
| format  | string | mp4      | 视频格式（仅视频）：`mp4`、`webm`、`mov`            |
| quality | string | original | 视频质量：`original`、`high`、`medium`、`low`       |

**响应**: 文件流

**示例**:

```bash
# 下载原视频
curl -O https://api.frameforge.com/api/v1/tasks/task_abc123xyz/download?type=video

# 下载缩略图
curl -O https://api.frameforge.com/api/v1/tasks/task_abc123xyz/download?type=thumbnail

# 下载特定格式
curl -O "https://api.frameforge.com/api/v1/tasks/task_abc123xyz/download?type=video&format=webm"
```

### 8.3 获取预览链接

**GET** `/api/v1/tasks/{taskId}/preview`

获取临时预览链接。

**响应** (200 OK):

```json
{
  "previewUrl": "https://cdn.frameforge.com/preview/xyz?token=abc",
  "expiresAt": 1747987500000
}
```

---

## 九、Webhook

### 9.1 创建 Webhook

**POST** `/api/v1/webhooks`

创建 Webhook 用于接收事件通知。

**请求体**:

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["task.completed", "task.failed", "step.completed"],
  "secret": "your_webhook_secret"
}
```

**响应** (201 Created):

```json
{
  "webhookId": "wh_xyz",
  "url": "https://your-server.com/webhook",
  "events": ["task.completed", "task.failed", "step.completed"],
  "createdAt": 1747987200000
}
```

### 9.2 获取 Webhook 列表

**GET** `/api/v1/webhooks`

### 9.3 更新 Webhook

**PATCH** `/api/v1/webhooks/{webhookId}`

### 9.4 删除 Webhook

**DELETE** `/api/v1/webhooks/{webhookId}`

### 9.5 Webhook 事件类型

| 事件               | 说明         |
| ------------------ | ------------ |
| `task.created`     | 任务创建     |
| `task.started`     | 任务开始执行 |
| `task.paused`      | 任务暂停     |
| `task.resumed`     | 任务恢复     |
| `task.completed`   | 任务完成     |
| `task.failed`      | 任务失败     |
| `task.cancelled`   | 任务取消     |
| `step.started`     | 步骤开始     |
| `step.completed`   | 步骤完成     |
| `step.failed`      | 步骤失败     |
| `render.progress`  | 渲染进度更新 |
| `render.completed` | 渲染完成     |

### 9.6 Webhook Payload 示例

```json
{
  "event": "task.completed",
  "timestamp": 1747987400000,
  "taskId": "task_abc123xyz",
  "data": {
    "status": "completed",
    "output": {
      "videoPath": "/output/task_abc123xyz/final.mp4",
      "duration": 1200
    }
  },
  "signature": "sha256=abc123..."
}
```

---

## 十、存储

### 10.1 上传文件

**POST** `/api/v1/storage/upload`

上传文件到任务存储。

**请求**: `multipart/form-data`

| 字段     | 类型   | 说明                                     |
| -------- | ------ | ---------------------------------------- |
| file     | File   | 要上传的文件                             |
| taskId   | string | 关联的任务 ID                            |
| category | string | 文件类别：`input`、`reference`、`output` |

**响应** (200 OK):

```json
{
  "fileId": "file_xyz",
  "path": "/storage/tasks/task_abc123xyz/input/file.pdf",
  "size": 1048576,
  "mimeType": "application/pdf"
}
```

### 10.2 获取上传链接（预签名 URL）

**POST** `/api/v1/storage/presigned-url`

获取预签名上传 URL（用于大文件直传）。

**请求体**:

```json
{
  "taskId": "task_abc123xyz",
  "filename": "large_video.mp4",
  "contentType": "video/mp4",
  "size": 104857600
}
```

**响应** (200 OK):

```json
{
  "uploadUrl": "https://minio.example.com/...",
  "fileId": "file_xyz",
  "expiresAt": 1747987260000
}
```

### 10.3 删除文件

**DELETE** `/api/v1/storage/{fileId}`

---

## 十一、错误码

### 11.1 错误响应格式

所有错误响应都遵循以下格式：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {},
    "requestId": "req_xyz"
  }
}
```

### 11.2 错误码列表

| 错误码                | HTTP 状态 | 说明                 |
| --------------------- | --------- | -------------------- |
| `INVALID_INPUT`       | 400       | 输入参数无效         |
| `CONTENT_TOO_SHORT`   | 400       | 内容过短             |
| `INVALID_MODE`        | 400       | 无效的运行模式       |
| `UNAUTHORIZED`        | 401       | 未授权               |
| `TOKEN_EXPIRED`       | 401       | Token 已过期         |
| `FORBIDDEN`           | 403       | 无权限访问           |
| `TASK_NOT_FOUND`      | 404       | 任务不存在           |
| `STEP_NOT_FOUND`      | 404       | 步骤不存在           |
| `CHARACTER_NOT_FOUND` | 404       | 角色不存在           |
| `INVALID_STATE`       | 400       | 任务状态不允许此操作 |
| `STEP_NOT_COMPLETED`  | 400       | 前置步骤未完成       |
| `RATE_LIMITED`        | 429       | 请求频率超限         |
| `INTERNAL_ERROR`      | 500       | 服务器内部错误       |
| `SERVICE_UNAVAILABLE` | 503       | 服务不可用           |

---

## 十二、SDK

### 12.1 JavaScript/TypeScript SDK

```bash
npm install @frameforge/api-sdk
```

```typescript
import { FrameForgeAPI } from '@frameforge/api-sdk';

const api = new FrameForgeAPI({
  baseUrl: 'https://api.frameforge.com/api/v1',
  token: 'your_access_token',
});

// 创建任务
const task = await api.tasks.create({
  title: '我的漫剧',
  mode: 'novel',
  content: novelText,
  style: 'anime',
});

// 获取任务状态
const status = await api.tasks.get('task_abc123xyz');

// 启动任务
await api.tasks.start('task_abc123xyz');

// 监听进度（WebSocket）
api.tasks.subscribe('task_abc123xyz', (event) => {
  console.log('Progress:', event.progress);
});
```

### 12.2 Python SDK

```bash
pip install frameforge-api
```

```python
from frameforge import FrameForgeAPI

api = FrameForgeAPI(
    base_url='https://api.frameforge.com/api/v1',
    token='your_access_token'
)

# 创建任务
task = api.tasks.create(
    title='我的漫剧',
    mode='novel',
    content=novel_text,
    style='anime'
)

# 获取任务状态
status = api.tasks.get('task_abc123xyz')

# 下载输出
api.tasks.download(
    'task_abc123xyz',
    output_path='./output.mp4'
)
```

---

## 十三、速率限制

| 端点                   | 限制 | 窗口   |
| ---------------------- | ---- | ------ |
| POST /tasks            | 10   | 每分钟 |
| GET /tasks             | 60   | 每分钟 |
| POST /tasks/{id}/start | 20   | 每分钟 |
| POST /storage/upload   | 30   | 每分钟 |
| 其他端点               | 100  | 每分钟 |

速率限制响应会包含以下 Header：

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1747987260
```

当超过限制时，API 返回 `429 Too Many Requests` 错误。
