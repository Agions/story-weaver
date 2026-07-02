---
title: 渲染与导出
description: frame-fab 视频渲染与最终导出：FFmpeg 合成、字幕嵌入、多格式输出、批量导出
category: user-guide
version: '>=3.0'
---

# 渲染与导出

> frame-fab 的**第 10-11 步**：把分镜、配音、字幕、背景音乐合成为最终成片。

---

## 一、导出流程

```
分镜关键帧（图片/视频）
  │
  ▼
视频编辑（拼接 + 转场）
  │
  ▼
配音合成（TTS + 唇形同步）
  │
  ▼
字幕嵌入（SRT/VTT/ASS）
  │
  ▼
背景音乐（可选）
  │
  ▼
FFmpeg 合成
  │
  ▼
最终输出（MP4 / WebM / MOV）
```

---

## 二、支持的输出格式

| 格式 | 编码 | 适用场景 | 浏览器兼容 |
|------|------|---------|-----------|
| **MP4 (H.264)** | `libx264 + aac` | 通用首选 | ✅ 全部 |
| **WebM (VP9)** | `libvpx-vp9 + opus` | 网页嵌入 | ✅ Chrome/Firefox |
| **MOV (ProRes)** | `prores_ks + pcm_s24le` | 专业剪辑 | ⚠️ 桌面端 |
| **GIF** | `gif` | 短预览 | ✅ 全部 |

---

## 三、配置选项

### 3.1 视频设置

| 选项 | 推荐 | 范围 |
|------|------|------|
| 分辨率 | 1080p | 720p / 1080p / 4K |
| 帧率 | 30 fps | 24 / 30 / 60 |
| 码率 | 8 Mbps | 2-50 Mbps |
| 编码预设 | medium | ultrafast → veryslow |

### 3.2 音频设置

| 选项 | 推荐 | 范围 |
|------|------|------|
| 编码 | AAC | AAC / MP3 / Opus |
| 采样率 | 48000 Hz | 24000 / 44100 / 48000 |
| 比特率 | 192 kbps | 96-320 kbps |

### 3.3 字幕设置

| 选项 | 推荐 |
|------|------|
| 字体 | 思源黑体 / 苹方 |
| 字号 | 24 px（1080p） |
| 位置 | 底部 |
| 描边 | 2 px 黑色 |

---

## 四、合成引擎

frame-fab 使用 **双引擎** 策略：

| 引擎 | 适用 | 性能 |
|------|------|------|
| **FFmpeg (本地子进程)** | 桌面端默认 | ⭐⭐⭐⭐⭐ |
| **FFmpeg.wasm (Web)** | Web 端降级 | ⭐⭐⭐ |

---

## 五、API 调用

```typescript
import { videoCompositorService } from '@/core/services';

const result = await videoCompositorService.compose({
  videoClips: [...],          // 视频片段列表
  audioTracks: [...],         // 音频轨（配音/背景）
  subtitles: [...],           // 字幕
  output: {
    format: 'mp4',
    resolution: '1080p',
    fps: 30,
    bitrate: '8M',
  },
  outputPath: 'output/result.mp4',
  onProgress: (p) => console.log(p),
});
```

详见 [API - 流水线服务](../api/pipeline-service.md)。

---

## 六、批量导出

支持批量导出多个项目：

```
项目列表 → 多选 → [批量导出]
   │
   ▼
选择目标格式
   │
   ▼
后台队列（最多 3 个并发）
```

---

## 七、性能与质量

### 7.1 导出时间估算

| 项目长度 | 720p | 1080p | 4K |
|---------|------|-------|----|
| 1 分钟 | 10s | 30s | 2min |
| 5 分钟 | 30s | 2min | 10min |
| 30 分钟 | 3min | 10min | 60min |

### 7.2 质量优化建议

- **使用 GPU 编码**（NVENC / VideoToolbox / VAAPI）
- **设置合理的码率**（过高浪费，过低有损）
- **二次编码** vs **直接流复制**（如果格式不变）

---

## 八、常见问题

### Q1: 导出失败 / 卡住？

A: 检查：

- 磁盘空间是否充足（>2x 文件大小）
- FFmpeg 是否正确安装
- 内存是否够用（4K 导出需要 ≥ 16GB）

### Q2: 字幕不显示？

A: 确认播放器支持 SRT/VTT，或在导出时**硬烧字幕**（即将字幕烧入视频像素）。

### Q3: 音画不同步？

A: 启用「**音画同步检查**」重新对齐；通常 TTS 时间轴和分镜时长不匹配时出现。

### Q4: 4K 导出慢？

A: 启用硬件加速（NVENC/QSV/VideoToolbox），1080p 推荐 `medium` 预设，4K 推荐 `fast`。

---

## 九、相关文档

- [TTS 服务](../api/tts-service.md)
- [字幕服务](../api/subtitle-service.md)
- [分镜设计](./storyboard-design.md)
- [性能基准 v2.2.3](../performance/benchmark-2.2.3.md)
