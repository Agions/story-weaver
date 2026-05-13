# 构建与部署

panel-flow 构建和部署指南。

## 构建命令

```bash
# Web 开发
pnpm dev

# 生产构建
pnpm build

# 预览生产构建
pnpm preview

# Tauri 桌面应用构建
pnpm tauri build
```

## Web 部署

### Vercel

```bash
npm i -g vercel
vercel --prod
```

### Netlify

```bash
npm i -g netlify-cli
netlify deploy --dir=dist --prod
```

### Docker

```bash
docker build -t panelflow .
docker run -p 8080:80 panelflow
```

## 环境配置

```bash
# AI 提供商
VITE_MINIMAX_API_KEY=your_key
VITE_SEEDDREAM_API_KEY=your_key

# 应用
VITE_APP_MODE=web
```

## 桌面应用 (Tauri)

### 构建

```bash
pnpm tauri build
```

输出位置：

- macOS: `src-tauri/target/release/bundle/dmg/`
- Linux: `src-tauri/target/release/bundle/appimage/`
- Windows: `src-tauri/target/release/bundle/msi/`
