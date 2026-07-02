---
title: 用户指南
description: frame-fab 用户手册索引：双模式工作流、剧本/角色/分镜/渲染/合成 全流程
category: user-guide
version: '>=3.0'
---

# 用户指南

> 欢迎使用 **frame-fab v2.2.3**！本指南帮助你从零开始，把一本小说自动拍成漫剧。

---

## 🎬 工作流概览

| 文档 | 说明 |
|------|------|
| [工作流概览](./workflow-overview.md) | 10 步流水线 + 双模式（Autonomous/Manual） |
| [Autonomous 模式](./autonomous-mode.md) | 全自动一键成片（推荐新手） |
| [Manual 模式](./manual-mode.md) | 逐步审批精细控制 |
| [导入与分析](./import-analysis.md) | 小说/剧本导入 + 章节切分 + 人物识别 |
| [脚本生成](./script-generation.md) | 从小说/剧本文本生成结构化剧本 |
| [角色设计](./character-design.md) | 角色设定卡 + 跨场景一致性 |
| [分镜设计](./storyboard-design.md) | 分镜脚本 + 参考图生成 |
| [渲染与导出](./rendering-export.md) | TTS/字幕/FFmpeg 合成 MP4 |

---

## 🚀 快速路径

| 你的需求 | 推荐起点 |
|---------|---------|
| **第一次使用** | 跟着 [工作流概览](./workflow-overview.md) 走一遍 |
| **只想跑通** | 直接看 [Autonomous 模式](./autonomous-mode.md) 一键成片 |
| **想细调** | 阅读 [Manual 模式](./manual-mode.md) 的逐步审批流程 |
| **解决角色漂移** | 跳到 [角色设计 - 一致性](./character-design.md#角色一致性) |
| **导出失败** | 跳到 [渲染导出 - 常见问题](./rendering-export.md#八常见问题) |

---

## 🧩 双模式对比

| 维度 | Autonomous Mode | Manual Mode |
|------|----------------|-------------|
| **用户参与** | 零（仅提供原材料） | 高（每步审批） |
| **AI 自审** | ✅ 启用（每步 + 重试 ≤3） | ❌ 不启用 |
| **断点续传** | ✅ 30s 自动 Checkpoint | ❌ 不支持 |
| **适用场景** | 快速成片、批量生产 | 定制化、特定需求 |
| **预估时间** | 15-30 min（短篇） | 数小时（取决于细调） |

---

## 🛠️ 全流程地图

```
📖 小说/剧本
   │
   ▼
[1] 导入与解析
   │   ↓
[2] AI 内容分析  ── 识别场景/人物/情节
   │   ↓
[3] 脚本生成    ── 结构化视频剧本
   │   ↓
[4] 角色设计    ── 设定卡 + 一致性
   │   ↓
[5] 场景规划    ── 镜头/景别/运镜
   │   ↓
[6] 分镜设计    ── 分镜脚本 + 参考图
   │   ↓
[7] 关键帧渲染  ── Seedream/Kling/Vidu
   │   ↓
[8] 视频剪辑    ── 转场/运镜
   │   ↓
[9] 配音合成    ── TTS + 唇形同步
   │   ↓
[10] 字幕生成   ── SRT/VTT/ASS
   │   ↓
[11] 最终导出   ── MP4/WebM/MOV
   │
   ▼
🎬 成片
```

---

## 📖 相关资源

- [API 文档](../api/) — 开发者接口
- [快速开始](../getting-started/quick-start.md) — 3 步上手
- [配置 API Key](../getting-started/configuration.md) — 多模型 AI 配置
- [架构设计](../developer-guide/architecture.md) — 系统架构
- [品牌设计指南](../BRAND_GUIDELINES.md) — Logo / 配色 / 字体规范
