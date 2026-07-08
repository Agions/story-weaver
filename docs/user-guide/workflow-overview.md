---
title: 工作流概览
description: Story Weaver 完整工作流概览：10 步流水线、Autonomous/Manual 双模式、Quality Gate、Self-Review Loop
category: user-guide
version: '>=3.0'
---

# 工作流概览

> Story Weaver 的工作流是一个 **10 步端到端流水线**（实际细分 11 个 stage），支持 **Autonomous（全自动）** 和 **Manual（手动）** 两种模式。

---

## 一、双模式全景

| 维度                 | Autonomous Mode                  | Manual Mode            |
| -------------------- | -------------------------------- | ---------------------- |
| **用户操作**         | 提供原材料 → 按「开始」→ 等待    | 逐步审批 / 编辑 / 调整 |
| **AI 行为**          | 自主分析 → 生成 → 审核 → 修复    | 按指令执行             |
| **Quality Gate**     | ✅ 每步自动评分（fail 触发重试） | ⚠️ 仅提示，人工把关    |
| **Self-Review Loop** | ✅ 失败自动重试（≤3 次）         | ❌ 不重试              |
| **断点续传**         | ✅ 30s 自动 Checkpoint           | ❌ 不支持              |
| **适合场景**         | 批量生产、快速成片               | 精细定制、特定需求     |
| **预估时间**         | 15-30 min（短篇）                | 数小时（取决于细调）   |

---

## 二、10 步流水线

```mermaid
graph LR
  A[1 导入] --> B[2 分析]
  B --> C[3 脚本]
  C --> D[4 角色]
  D --> E[5 场景]
  E --> F[6 分镜]
  F --> G[7 渲染]
  G --> H[8 视频剪辑]
  H --> I[9 配音]
  I --> J[10 字幕]
  J --> K[11 导出]
```

| #   | 步骤                  | 核心产物                       | AI 依赖     | Autonomous |
| --- | --------------------- | ------------------------------ | ----------- | ---------- |
| 1   | 导入 `import`         | 章节切分 + 文本清理            | —           | ✅         |
| 2   | 分析 `analysis`       | 故事结构 + 人物清单 + 场景识别 | 文本模型    | ✅         |
| 3   | 脚本 `script`         | 结构化视频剧本（JSON/MD）      | 文本模型    | ✅         |
| 4   | 角色 `character`      | 角色设定卡 + 参考图            | 文本 + 图像 | ✅         |
| 5   | 场景 `scene`          | 场景清单 + 镜头/景别规划       | 文本模型    | ✅         |
| 6   | 分镜 `storyboard`     | 分镜脚本 + 参考图              | 文本 + 图像 | ✅         |
| 7   | 渲染 `render`         | 关键帧视频                     | 视频模型    | ✅         |
| 8   | 视频剪辑 `video-edit` | 镜头拼接 + 转场                | 视频处理    | ✅         |
| 9   | 配音 `audio`          | 配音 + 唇形同步                | TTS + VLM   | ✅         |
| 10  | 字幕 `subtitle`       | SRT/VTT/ASS                    | 字幕生成    | ✅         |
| 11  | 导出 `export`         | MP4/WebM/MOV                   | FFmpeg 合成 | ✅         |

> 详细的 10 步实现细节见 [架构设计 - core/pipeline/](../developer-guide/architecture.md#42-corepipeline--流水线引擎)。

---

## 三、质量保障机制

### 3.1 Quality Gate（每步评分）

每一步输出都会经过 **Quality Gate** 自动评分：

```
[Step N 输出] → QualityGate 判定
                       │
              ┌────────┴────────┐
              │                 │
            PASS              FAIL
              │                 │
              ▼           触发 Self-Review
          下一 步              │
                                ▼
                          优化 Prompt
                          重新执行 Step N
                          （最多 3 次）
```

**评分维度**：

| 维度       | 阈值   | 说明               |
| ---------- | ------ | ------------------ |
| 角色一致性 | ≥ 0.85 | VLM 比对角色外观   |
| 视觉质量   | ≥ 0.80 | 构图/光影合理性    |
| 脚本对齐   | ≥ 0.90 | 与原始剧本的吻合度 |
| 完整性     | 100%   | 必填字段不缺       |

### 3.2 Self-Review Loop

审核失败时自动重试：

- **最多 3 次循环**
- 每次循环**优化 Prompt**（注入失败原因）
- 3 次仍不通过 → 记录日志 + 继续后续步骤（不阻塞流程）

### 3.3 Checkpoint（断点续传）

Autonomous 模式**每 30 秒**自动保存 Checkpoint 到本地：

- 应用崩溃 → 启动后自动恢复
- 断网 → 重连后从最近状态继续
- 切换设备 → 导入 checkpoint 文件继续

---

## 四、成本与时间估算

| 输入长度         | Autonomous 预估时间 | 预估成本（API 调用） |
| ---------------- | ------------------- | -------------------- |
| 短篇 (1-3 万字)  | 15-30 min           | ¥5-15                |
| 中篇 (5-10 万字) | 30-60 min           | ¥15-50               |
| 长篇 (10 万字+)  | 1-2 h               | ¥50-200              |

> 实际成本取决于**所选 AI Provider**（详见 [配置 AI API Key](../getting-started/configuration.md)）。
> 默认 Fallback Chain（GLM-5 + Seedream 5.0 + Edge TTS）一集 5 分钟漫剧约 **¥8-12**。

---

## 五、下一步

| 你的角色 | 推荐阅读                                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| 新手     | [Autonomous 模式](./autonomous-mode.md)                                                                     |
| 高级用户 | [Manual 模式](./manual-mode.md)                                                                             |
| 创作者   | [脚本生成](./script-generation.md) / [角色设计](./character-design.md) / [分镜设计](./storyboard-design.md) |
| 开发集成 | [API 文档 - 流水线](../api/pipeline-service.md)                                                             |
