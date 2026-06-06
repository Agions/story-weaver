---
title: 架构决策记录 (ADR)
---

# 架构决策记录 (ADR)

本目录记录 frame-fab 项目的重大架构决策。每个 ADR 是一份不可变的历史快照,描述决策**当时的**背景、方案选择、和后果。

## 什么是 ADR

**ADR (Architecture Decision Record)** 是一种轻量级的文档形式,用于:

- 📜 记录"为什么"而不只是"是什么"
- 🔍 让新成员快速理解项目历史
- ⚖️ 让权衡思考可见
- 🛡️ 避免重复讨论已经决定过的问题

## 索引

| 编号                                             | 标题                              | 状态        | 日期    |
| ------------------------------------------------ | --------------------------------- | ----------- | ------- |
| [ADR-0001](/adr/0001-tauri-desktop-architecture) | Tauri 桌面端架构                  | ✅ Accepted | 2024-12 |
| [ADR-0002](/adr/0002-frontend-monorepo-ddd)      | 前端分层架构 (DDD)                | ✅ Accepted | 2024-12 |
| [ADR-0003](/adr/0003-platform-adapter)           | Platform Adapter 平台适配层       | ✅ Accepted | 2026-06 |
| [ADR-0004](/adr/0004-brand-redesign)             | 品牌 v3.0 重新设计                | ✅ Accepted | 2026-06 |
| [ADR-0005](/adr/0005-provider-registry)          | Provider Registry 多模型编排      | ✅ Accepted | 2025-03 |
| [ADR-0006](/adr/0006-pipeline-engine)            | Pipeline Engine + Checkpoint 机制 | ✅ Accepted | 2025-08 |

## 模板

新增 ADR 时,使用以下模板:

```markdown
# ADR-NNNN: <title>

## 状态

Proposed | Accepted | Deprecated | Superseded by ADR-XXXX

## 背景

什么问题触发了这次决策?

## 评估的方案

1. 方案 A
2. 方案 B
3. 方案 C

## 决策

我们选择什么?

## 理由

为什么? 列举关键考量。

## 后果

- ✅ 正面影响
- ❌ 负面影响
- ⚠️ 风险/限制

## 替代方案

我们没选什么,为什么?
```

## 相关资源

- [架构概览](/developer-guide/architecture)
- [模块系统](/developer-guide/module-system)
- [Michael Nygard 的 ADR 原始文章](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
