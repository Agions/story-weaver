---
title: 字幕服务
description: 字幕生成与嵌入，支持 SRT/VTT/ASS，含样式配置与时间轴对齐
category: api
version: >=2.4
---

# 字幕服务

字幕生成与多格式导出。

## 导入

```typescript
import { subtitleService } from '@/core/services';
```

## 主要方法

| 方法                                 | 说明               |
| ------------------------------------ | ------------------ |
| `generateSubtitles(script)`          | 从脚本生成字幕     |
| `exportSRT(subtitles, path)`         | 导出为 SRT 格式    |
| `exportVTT(subtitles, path)`         | 导出为 WebVTT 格式 |
| `exportASS(subtitles, path)`         | 导出为 ASS 格式    |
| `importSubtitles(file)`              | 导入字幕文件       |
| `mergeSubtitles(subtitles, timings)` | 合并字幕和时间轴   |
