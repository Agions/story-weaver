---
title: 品牌设计指南
description: frame-fab v2.2.3 视觉与品牌规范：Logo 体系、色彩、字体、组件、资产清单。所有贡献者请遵守。
category: brand
version: '>=3.0'
---

# 品牌设计指南 (Brand Guidelines)

> frame-fab v2.2.3 的视觉锤与品牌规范——Logo 构成、配色系统、字体栈、组件样式、资产清单。
> 任何视觉修改请先读本指南，并开 issue 走设计 review。

---

## 1. 品牌识别

**frame-fab** 是一款桌面端 AI 漫剧创作平台。

| 字段 | 内容 |
|------|------|
| **中文名** | frame-fab · AI 漫剧创作平台 |
| **英文名** | frame-fab · Novel-to-Video AI Pipeline |
| **Slogan** | 输入一本小说，AI 自动把它拍成一部漫剧——你只需要按「开始」 |
| **域名** | `framefab.app` |
| **主仓库** | `github.com/Agions/frame-fab` |
| **品牌定位** | 专业、活力、未来感、创作者友好 |

### 1.1 命名由来

- **frame**：分镜（storyboard frame）+ 一帧一秒的"视频感"
- **·**：分隔点既表示「帧·画」的动作转换，也呼应 logo 中的中心光点
- **fab**：fabricate（制造）+ fabrication lab（创意工厂）+ "fabulous" 的活力感

---

## 2. Logo 规范（v2.2.3 patch语言）

### 2.1 元素构成（自外向内 5 层）

Logo 由 5 层视觉元素组成，自外向内逐层深入：

```
┌──────────────────────────────────┐
│ ① 深底圆角方块（圆角 56/256px） │ ← 外壳
│   ┌──────────────────────────┐   │
│   │ ② 4 角装饰点 + 神经连接线│   │ ← 暗示多模型编排
│   │   ┌──────────────────┐   │   │
│   │   │ ③ 胶片帧 (5 帧) │   │   │ ← 胶片/分镜视觉锤
│   │   │  ┌──────────┐   │   │   │
│   │   │  │ ④ 胶片孔 │   │   │   │ ← 12 个 sprocket 孔
│   │   │  └──────────┘   │   │   │
│   │   │     ⑤ 中心光圈   │   │   │ ← 4 层同心圆 + 4 向脉冲
│   │   └──────────────────┘   │   │
│   └──────────────────────────┘   │
└──────────────────────────────────┘
```

| 元素 | 数量 | 含义 |
|------|------|------|
| ① 深底圆角方块 | 1 | 「容器 / 工厂 / 平台」 |
| ② 4 角装饰点 + 神经连接线 | 4 | 「多模型编排 / Agent 协作」 |
| ③ 胶片帧 | 5（3 主 + 2 半透明副帧） | 「分镜 / 视频 / 漫剧」 |
| ④ 胶片孔（sprocket） | 12（顶/底各 6） | 「电影感 / 经典/胶片」 |
| ⑤ 中心光圈 | 4 层同心圆 + 4 向脉冲 + 4 节点 | 「AI 启动 / 开始按钮 / 智能核心」 |

### 2.2 中心光圈 4 层比例

| 层 | 半径（相对 256 viewBox） | 颜色 | 含义 |
|----|------------------------|------|------|
| L1（外光晕） | r=46 | radial-gradient 紫→透明 | 能量扩散 |
| L2（强调环） | r=18 | 橙 → 红 渐变 | 启动按钮感 |
| L3（主品牌圆） | r=12 | 靛 → 紫 → 品红 渐变 | 品牌识别焦点 |
| L4（高亮） | r=5 白 + r=2 紫 | 实心 | "灯亮起" |

### 2.3 胶片帧比例

```
副帧 (40×88)  ┃  主左帧 (46×120)  ┃ 主中帧 (46×148) ┃ 主右帧 (46×120)  ┃ 副帧 (40×88)
```

- 副帧透明度 35%，暗示"前后镜头"
- 主中帧上下各多 14px，描边 +1 粗，视觉锚点
- 5 帧总宽 254px，居中于 256 画布

### 2.4 Logo 变体与文件命名

| 变体 | 文件 | 视图框 | 主用途 | 浅/深背景 |
|------|------|--------|--------|----------|
| 主方形 | `assets/logo.svg` | 256×256 | 应用图标 / GitHub avatar | 仅深背景 |
| 横向带字 | `assets/logo-horizontal.svg` | 800×200 | README 顶部 / 文档头 | 仅深背景 |
| 堆叠式 | `assets/logo-stacked.svg` | 360×400 | 营销页 / 海报 | 仅深背景 |
| 浅色版 | `assets/logo-light.svg` | 256×256 | 白色背景 / 打印 | 仅浅背景 |
| 单色版 | `assets/logo-mono.svg` | 256×256 | fax / 黑白印刷 / favicon fallback | 双背景 |
| 纯图标 | `assets/logo-symbol.svg` | 64×64 | 小图标 / 头像 | 仅深背景 |
| 纯文字 | `assets/logo-wordmark.svg` | 480×120 | 单色 wordmark | 仅浅背景 |
| OG Image | `assets/logo-og.svg` | 1280×640 | GitHub social card | 仅深背景 |

### 2.5 Logo 使用规范

#### ✅ DO

- 在深色背景（`#0B0E2C` 或更深）上使用主变体
- 保持 logo 周围至少 **16px**（小尺寸 ≥ 8px）安全空间
- 仅使用提供的官方 SVG / PNG，禁止自行重构
- 配套使用 PNG/ICO，**不要**直接嵌入未转曲的英文文字 SVG（不同系统字体不同）

#### ❌ DON'T

- 不要在浅色背景上直接使用主变体（用 `logo-light.svg`）
- 不要拉伸、扭曲、旋转 logo
- 不要修改主色调或主渐变
- 不要添加阴影、描边、滤镜
- 不要把 logo 文字与图标拆开使用（用专门的 symbol/wordmark 版）
- 不要用 emoji（🎬 / 🎥 / ✨ / 🤖 等）替代 logo

---

## 3. 色彩系统

### 3.1 品牌主色（Brand Primary）

| 名称 | 色值 | HSL | 用途 |
|------|------|-----|------|
| **Indigo-500** | `#6366F1` | hsl(239, 84%, 67%) | 主品牌渐变起点、链接、强调 |
| **Purple-500** | `#A855F7` | hsl(271, 91%, 65%) | 主品牌渐变中段、按钮 hover、聚焦 |
| **Pink-500** | `#EC4899` | hsl(330, 81%, 60%) | 主品牌渐变末段、CTA、关键操作 |
| **Orange-400** | `#FB923C` | hsl(27, 96%, 61%) | 强调色渐变起点、活力信号 |
| **Red-500** | `#F43F5E` | hsl(351, 89%, 60%) | 强调色渐变末段、错误、停止 |

### 3.2 品牌渐变（CSS 可用）

```css
/* 主品牌渐变（最常用，对角线） */
.brand-primary {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
}

/* 主品牌渐变（横向，用于文字 + 按钮） */
.brand-primary-h {
  background: linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
}

/* 强调色渐变（对角线，用于警示/活力元素） */
.brand-accent {
  background: linear-gradient(45deg, #fb923c 0%, #f43f5e 100%);
}

/* 深底径向晕（logo + OG Image 背景） */
.brand-bg {
  background: radial-gradient(ellipse at 50% 48%, #1A1B3E 0%, #0B0E2C 100%);
}

/* 中心光圈脉冲 */
.brand-pulse {
  background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(168,85,247,0.55) 35%, rgba(99,102,241,0) 100%);
}
```

### 3.3 中性色

| 名称 | 色值 | 用途 |
|------|------|------|
| **Space-900** | `#0B0E2C` | 主背景、logo 底色 |
| **Space-800** | `#1A1B3E` | 卡片背景、logo 径向晕中心 |
| **Gray-500** | `#6B7280` | 副标题、说明文字 |
| **Gray-400** | `#9CA3AF` | 弱化文字、辅助信息 |
| **Gray-300** | `#D1D5DB` | 分割线、占位 |
| **Gray-100** | `#F3F4F6` | 浅色背景、logo-light 边框 |
| **Gray-50** | `#F9FAFB` | 最浅底色 |
| **White** | `#FFFFFF` | 前景、中心高亮 |

### 3.4 主题适配

- **Dark Mode**（默认）：Space-900 背景 + 主色渐变文字
- **Light Mode**：白底 + 主色渐变文字（logo 使用 `logo-light.svg`）
- **Tauri 桌面端**：仅使用 Dark Mode

---

## 4. 字体系统

### 4.1 Logo 字体

Logo 文字使用系统字体栈（不嵌入字体，保证跨平台一致）：

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
```

字重：**800 (ExtraBold)**，字距：**-2px**

### 4.2 副标字体（中英双语）

```css
/* 中文：苹方 / 微软雅黑优先 */
font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;

/* 英文：系统字体栈 */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
```

字重：500（Medium）- 600（Semibold），字距：1-3px

### 4.3 UI 字体（应用内）

```css
/* 与 shadcn/ui 保持一致 */
font-family:
  'Inter',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  sans-serif;
```

### 4.4 等宽字体（代码块）

```css
font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Monaco, Consolas, monospace;
```

---

## 5. 间距与比例

| 元素 | 数值 | 说明 |
|------|------|------|
| Logo 圆角（主） | `56px` / 256 viewBox（即 21.875%） | 圆角方块 |
| Logo 圆角（小尺寸） | `14px` / 64 viewBox | favicon / 应用图标 |
| Logo 安全空间 | `≥ 16px` 外围（小尺寸 ≥ 8px） | 视觉透气 |
| 胶片主帧宽 | `46px` / 256 | 三主帧等宽 |
| 胶片帧圆角 | `9px` | 圆角微调 |
| 副帧透明度 | `35%` | 暗示前后镜头 |
| 中心光圈 4 层半径比 | 46 : 18 : 12 : 5 | 黄金递进 |
| 主描边宽度 | `4-5px` / 256 | 视觉重量 |
| 副描边宽度 | `3px` / 256 | 重量减半 |
| 节点尺寸 | `r=1.8-2.2` | 神经节点感 |

---

## 6. 组件规范

### 6.1 按钮（VitePress / Web）

```vue
<!-- 品牌主按钮 -->
<VpButton theme="brand" text="开始创作 →" />

<!-- 备用主按钮（深底浅字） -->
<VpButton theme="alt" text="架构设计" />

<!-- 危险操作（用强调渐变 + 白字） -->
<VpButton theme="alt" text="停止生成" style="background:linear-gradient(45deg,#FB923C,#F43F5E);color:white" />
```

### 6.2 徽章（Tag / Badge）

```css
/* 透明填充 + 描边 + 主题色文字（OG Image / README 用） */
.brand-tag-indigo {
  background: rgba(99,102,241,0.15);
  border: 1px solid rgba(99,102,241,0.6);
  color: #C7D2FE;
}
/* 同理 .brand-tag-purple/-pink/-orange */
```

### 6.3 卡片（VitePress 文档 + 用户指南）

- 背景：透明度 6-10% 的品牌色 + 边框
- 圆角：12-16px
- 阴影：`0 8px 32px rgba(99,102,241,0.12)`（深底用 0.4 倍）

---

## 7. 应用场景示例

### 7.1 README 顶部

```markdown
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo-horizontal.svg" />
  <img src="public/logo-horizontal.svg" alt="frame-fab · AI 漫剧创作平台" width="480" />
</picture>
```

### 7.2 VitePress Hero 区（首页）

```yaml
hero:
  name: 'frame·fab'
  text: 'AI 漫剧创作平台'
  tagline: '输入一本小说，AI 自动把它拍成一部漫剧'
  image:
    src: /logo.svg
    alt: frame-fab · AI 漫剧创作平台
  actions:
    - theme: brand
      text: 快速开始 →
      link: /getting-started/installation
```

### 7.3 OG Image（GitHub social card）

直接使用 `public/og-image.png`（1280×640，~294 KB）。

---

## 8. 品牌声音 (Brand Voice)

**调性**：专业但不生硬，活泼但不轻浮，技术但不冰冷。

**语调指南**：

- ✅ "输入一本小说，AI 自动把它拍成一部漫剧"（动作化、具体）
- ✅ "你只需要按开始"（低门槛承诺）
- ✅ "把 3 个月的周期压缩到 5 天"（量化价值）
- ❌ "运用先进 AI 技术实现内容创作自动化"（空话、营销腔）
- ❌ "一键生成好莱坞大片"（过度承诺）

**避免**：

- 过度承诺、行业黑话堆砌
- 性别/地域/文化偏见
- "颠覆""革命""重新定义"等夸张词
- 大段 emoji 刷屏（克制使用，每个章节不超过 1-2 个）

---

## 9. 资产清单

### 9.1 源 SVG（`assets/`）

```
logo.svg              主方形 (256×256) — 应用图标/avatar
logo-horizontal.svg   横向带字 (800×200) — README/文档头
logo-stacked.svg      堆叠式 (360×400) — 营销页/海报
logo-light.svg        浅色版 (256×256) — 白底场景
logo-mono.svg         单色版 (256×256) — 黑白印刷
logo-symbol.svg       纯图标 (64×64) — 小图标
logo-wordmark.svg     纯文字 (480×120) — 单色 wordmark
logo-og.svg           OG Image (1280×640) — GitHub 社交卡
```

### 9.2 PNG 多尺寸（`assets/`）

```
logo-{128,256,512,1024}.png      主方形多尺寸
logo-horizontal.png              横向 (960×240)
logo-stacked.png                 堆叠式 (640×720)
```

### 9.3 静态资源（`public/`）

```
favicon.svg                       浏览器 favicon (矢量)
favicon-{16,32,48,64,128,256,512}x{...}.png   多尺寸 PNG
favicon.ico                       ICO 多尺寸合集
logo.svg                          Vite 用（copy 自 assets）
logo-horizontal.svg               Vite 用（copy 自 assets）
og-image.png                      OG Image (1280×640)
og-image.svg                      OG Image 源
```

### 9.4 VitePress 资源（`docs/public/`）

```
favicon.svg
logo.svg
logo-horizontal.svg
```

### 9.5 渲染脚本

```
scripts/render-assets.py   统一 SVG → PNG + ICO + 跨目录同步
```

**重新生成**：

```bash
# 安装依赖（首次）
pip install Pillow cairosvg

# 一键重渲染全部资产
python3 scripts/render-assets.py
```

---

## 10. 贡献指南

修改品牌资产前请：

1. 在 issue 中说明设计意图与必要性
2. 提供 SVG diff 或前后对比图
3. 跑 `python3 scripts/render-assets.py` 重新生成全套 PNG
4. 在 PR 中附 OG Image + 主 logo PNG 截图
5. 经 **1 名 maintainer** 审批后合入

如有疑问或建议：[GitHub Discussions](https://github.com/Agions/frame-fab/discussions)
