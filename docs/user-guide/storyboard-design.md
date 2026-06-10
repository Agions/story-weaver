---
title: 分镜设计
description: frame-fab 分镜脚本自动生成：景别/运镜/参考图、Self-Review 一致性检查
category: user-guide
version: '>=3.0'
---

# 分镜设计

> 本文档介绍 frame-fab 中的分镜设计功能，包括分镜脚本生成、参考图生成以及分镜审核机制。

---

## 目录

- [概述](#概述)
- [分镜脚本](#分镜脚本)
- [参考图生成](#参考图生成)
- [分镜审核](#分镜审核)
- [手动编辑](#手动编辑)
- [常见问题](#常见问题)

---

## 概述

分镜设计（Storyboard Design）是 frame-fab 工作流中的核心步骤。在完成角色设计和脚本生成后，系统会将每个分镜转换为可视化的故事板，包括分镜脚本和对应的参考图。

### 分镜设计流程

```
分镜脚本 → 画面描述优化 → 参考图生成 → 一致性检查 → Quality Gate → 通过
```

### 输出内容

| 输出     | 说明                                |
| -------- | ----------------------------------- |
| 分镜脚本 | 每个分镜的详细描述（JSON/Markdown） |
| 参考图   | AI 生成的画面参考图（PNG）          |
| 镜头参数 | 相机运动、光影参数等                |

---

## 分镜脚本

### 分镜脚本结构

每个分镜包含完整的描述信息：

```json
{
  "shot_id": "shot_001",
  "scene_id": "scene_001",
  "sequence": 1,
  "shot_type": "中景",
  "camera": {
    "movement": "固定",
    "angle": "水平",
    "focus": "李明"
  },
  "visual": {
    "description": "李明站在办公桌后，手指敲击桌面，表情严肃。窗外城市天际线作为背景，光线从左侧照射。",
    "style": "电影风格",
    "mood": "紧张"
  },
  "characters": [
    {
      "id": "char_001",
      "name": "李明",
      "position": "画面中央偏左",
      "action": "站立、手指敲击桌面",
      "expression": "严肃"
    }
  ],
  "dialogue": {
    "text": "这件事必须今天解决。",
    "speaker": "李明"
  },
  "sound": {
    "ambient": "办公室环境音",
    "sfx": "手指敲击桌面声"
  },
  "timing": {
    "duration": 5,
    "transition": "切"
  }
}
```

### 镜头类型

| 类型         | 说明       | 使用场景       |
| ------------ | ---------- | -------------- |
| 特写 (ECU)   | 脸部或细节 | 强调表情、物品 |
| 近景 (CU)    | 胸部以上   | 对话、反应     |
| 中景 (MS)    | 膝盖以上   | 日常场景       |
| 中远景 (MLS) | 小腿以上   | 空间感场景     |
| 远景 (LS)    | 全身       | 环境展示       |
| 全景 (EWS)   | 广阔范围   | 大场面         |

### 相机运动

| 运动类型      | 说明         |
| ------------- | ------------ |
| 固定          | 镜头不动     |
| 推 (Push in)  | 镜头向前推进 |
| 拉 (Pull out) | 镜头向后拉远 |
| 摇 (Pan)      | 镜头左右转动 |
| 移 (Dolly)    | 镜头跟随移动 |
| 跟 (Follow)   | 镜头跟随角色 |

---

## 参考图生成

### 生成流程

```
分镜脚本 → 提示词优化 → Seedream 渲染 → 参考图输出
```

### 提示词模板

系统会根据分镜脚本自动生成图像提示词：

```yaml
# 输入
visual_description: "李明站在办公桌后，手指敲击桌面，表情严肃"

# 生成的提示词
prompt: """
cinematic shot, medium shot,
a man (Chinese, short black hair, sharp eyes, serious expression)
standing behind a modern office desk,
fingers tapping on the desk,
modern office interior with city skyline through window,
left side lighting, professional atmosphere,
high quality, film still
"""

negative_prompt: """
anime, cartoon, low quality, blurry,
deformed, bad anatomy, bad hands
"""
```

### 图像参数

| 参数   | 设置                     |
| ------ | ------------------------ |
| 分辨率 | 1920 × 1080 (16:9)       |
| 格式   | PNG                      |
| 风格   | 电影质感                 |
| 长宽比 | 16:9 / 4:3 / 1:1（可选） |

### 一致性保障

参考图生成时会自动嵌入角色设定卡信息：

```
角色外观约束 → 强制一致性 → 输出参考图
```

---

## 分镜审核

### Self-Review 检查

生成参考图后，系统会自动进行质量审核：

| 检查项     | 说明                     |
| ---------- | ------------------------ |
| 角色一致性 | 角色外观是否与设定卡一致 |
| 场景准确性 | 场景是否符合脚本描述     |
| 画面质量   | 构图、光影是否合理       |
| 文字可读性 | 画面中文字是否清晰       |

### Quality Gate

审核通过后进入 Quality Gate：

```python
quality_gate_check(shot):
    consistency_score = check_character_consistency(shot)
    visual_quality = assess_visual_quality(shot)
    script_alignment = verify_script_alignment(shot)

    if all([
        consistency_score >= 0.85,
        visual_quality >= 0.80,
        script_alignment >= 0.90
    ]):
        return "PASS"
    else:
        return "RETRY"
```

### 重生成机制

如审核未通过：

1. **自动重试** — 最多 3 次
2. **参数调整** — 优化提示词后重试
3. **备选模型** — 如主模型失败，自动切换 Kling/Vidu

---

## 手动编辑

### Manual Mode 编辑

在 Manual Mode 下，用户可以手动编辑分镜：

1. **打开故事板视图** — 查看所有分镜缩略图
2. **选择分镜** — 点击进入详情
3. **编辑内容** — 修改描述、参数
4. **重新生成** — 应用更改

### 可编辑内容

| 字段     | 说明         |
| -------- | ------------ |
| 镜头类型 | 切换镜头大小 |
| 相机运动 | 调整运动方式 |
| 画面描述 | 重新描述画面 |
| 角色位置 | 调整角色站位 |
| 光影设置 | 修改光源     |

### 快捷操作

| 操作       | 说明                     |
| ---------- | ------------------------ |
| 批量重生成 | 选中多个分镜统一重新生成 |
| 复制分镜   | 复制现有分镜作为模板     |
| 调整顺序   | 拖拽调整分镜顺序         |

---

## 常见问题

### Q: 参考图与分镜脚本不符怎么办？

A: 在 Manual Mode 下可以手动编辑画面描述，然后重新生成参考图。建议描述越详细越好。

### Q: 如何生成不同风格的分镜？

A: 在分镜脚本的 `visual.style` 字段中指定风格（如「动漫风格」「电影风格」「水墨风格」），系统会据此生成对应风格的参考图。

### Q: 支持同时生成多个分镜吗？

A: 支持。系统支持批量生成，默认并发数为 4，可根据网络和 API 限额调整。

### Q: 如何导出分镜脚本和参考图？

A: 在项目目录中可以找到以下文件：

```
project/
├── storyboard/
│   ├── storyboard.json      # 分镜脚本
│   ├── shots/
│   │   ├── shot_001.png     # 参考图
│   │   ├── shot_002.png
│   │   └── ...
│   └── preview.mp4          # 故事板预览视频
```

### Q: 分镜审核失败的原因有哪些？

A: 常见原因包括：

- 角色外观与设定卡不一致
- 画面描述与脚本冲突
- 渲染质量不达标
- 图像生成超时

### Q: 如何提高参考图的生成质量？

A: 建议：

- 使用更详细的面部描述
- 指定具体的光影方向
- 添加画质相关的描述（如「高细节」「8K」）
- 避免模糊或抽象的描述

---

## 相关文档

- [脚本生成](./script-generation.md)
- [角色设计](./character-design.md)
- [渲染与导出](./rendering-export.md)
- [快速开始](../getting-started/quick-start.md)
