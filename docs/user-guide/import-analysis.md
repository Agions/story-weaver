---
title: 导入与分析
description: Story Weaver 导入与内容分析：多格式支持、自动章节切分、人物/场景识别
category: user-guide
version: '>=3.0'
---

# 导入与分析

> Story Weaver 的**第 1-2 步**：把小说/剧本导入系统，AI 自动分析结构。

---

## 一、支持的文件格式

| 格式     | 扩展名  | 大小限制 | 备注           |
| -------- | ------- | -------- | -------------- |
| 纯文本   | `.txt`  | 10 MB    | 首选，识别最准 |
| Markdown | `.md`   | 10 MB    | 保留结构       |
| Word     | `.docx` | 20 MB    | 自动提取文本   |
| PDF      | `.pdf`  | 20 MB    | OCR 后提取     |
| 直接粘贴 | —       | 50 万字  | 适合超长篇     |

> **不支持的格式**：EPUB（请先转纯文本）、扫描版 PDF（需先 OCR）、加密 PDF。

---

## 二、导入方式

### 2.1 桌面端

```
Story Weaver → 新建项目 → 选择文件 → 自动解析
```

### 2.2 拖拽上传

直接拖文件到 Story Weaver 窗口即可。

### 2.3 API 调用

```typescript
import { novelService } from '@/core/services';

const result = await novelService.import({
  filePath: '/path/to/novel.txt',
  encoding: 'utf-8',
});
// result: { projectId, chapters, totalChars, detectedType: 'novel' }
```

---

## 三、自动章节切分

系统使用 **正则 + AI 双重识别** 切分章节：

### 3.1 优先匹配规则

```
第X章 / 第X回 / Chapter X / CHAPTER X
```

### 3.2 AI 兜底识别

如未匹配到上述规则，使用 AI 分析：

- 段落长度突变
- 人物/场景变化
- 时间线跳转

### 3.3 手动调整

识别后可在 UI 中**手动增删/合并/重命名**章节。

---

## 四、内容分析（AnalysisStep）

AI 分析阶段产出：

### 4.1 故事结构

```json
{
  "title": "都市风云",
  "genre": "都市 / 商战",
  "totalChapters": 24,
  "estimatedDuration": "约 90 分钟漫剧",
  "mainPlot": "李明从普通职员到 CEO 的成长",
  "subplots": ["与王芳的感情线", "商业对手的阴谋"]
}
```

### 4.2 人物清单

```json
[
  {
    "id": "char_001",
    "name": "李明",
    "role": "主角",
    "appearances": 24,
    "firstAppearance": "第 1 章",
    "traits": ["果断", "聪明", "偶尔冲动"]
  },
  {
    "id": "char_002",
    "name": "王芳",
    "role": "女主",
    "appearances": 18,
    "firstAppearance": "第 3 章",
    "traits": ["温柔", "坚韧"]
  }
]
```

### 4.3 场景识别

```json
[
  {
    "id": "scene_001",
    "location": "李明办公室",
    "timeOfDay": "白天",
    "appearances": 8,
    "chapterRefs": [1, 5, 8, 12, 15, 18, 21, 24]
  }
]
```

---

## 五、导出分析结果

分析结果自动保存到项目目录：

```
project/
├── input/
│   └── source.txt            # 原始输入
├── analysis/
│   ├── structure.json        # 故事结构
│   ├── characters.json       # 人物清单
│   ├── scenes.json           # 场景清单
│   └── analysis-report.md    # 可读报告
```

---

## 六、常见问题

### Q1: 长篇小说导入很慢怎么办？

A: 超过 50 万字时，**优先使用 `.txt` 格式**。可以拆分章节分批导入。

### Q2: 章节切分不正确？

A: 在 UI 中手动调整章节边界。系统会记住你的偏好。

### Q3: 人物识别不准？

A: 可以在分析后**手动添加/删除**人物清单，再进入后续步骤。

### Q4: 想跳过分析直接生成脚本？

A: 可以在 [Manual 模式](./manual-mode.md) 下跳过步骤 2，但**强烈不建议**（后续步骤依赖人物/场景数据）。

---

## 七、相关文档

- [脚本生成](./script-generation.md) — 分析后下一步
- [角色设计](./character-design.md) — 人物识别结果
- [API - AI 服务](../api/ai-service.md) — `analyze()` 方法
