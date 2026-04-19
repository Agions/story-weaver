# 云端部署

将 PlotCraft 部署到云平台。

## Vercel

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Agions/PlotCraft)

### 手动部署

```bash
npm i -g vercel
vercel
```

### 配置 (vercel.json)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

## Netlify

### 部署

```bash
npm i -g netlify-cli
netlify deploy --dir=dist --prod
```

### 配置 (netlify.toml)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[headers]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## AWS Amplify

```bash
# 安装 Amplify CLI
npm install -g @aws-amplify/cli

# 初始化
amplify init

# 添加托管
amplify add hosting

# 发布
amplify publish
```

## Google Cloud Run

```bash
# 构建容器
gcloud builds submit --tag gcr.io/PROJECT_ID/plotcraft

# 部署
gcloud run deploy plotcraft --image gcr.io/PROJECT_ID/plotcraft --platform managed
```

## Docker Compose（自托管）

```yaml
# docker-compose.yml
version: '3.8'

services:
  plotcraft:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_APP_MODE=web
      - VITE_ALIBABA_API_KEY=${ALIB...KEY}
    restart: unless-stopped

  # 可选：后端代理
  api:
    image: nginx:alpine
    ports:
      - "3000:3000"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - plotcraft
```

## Cloudflare Pages

```bash
# 安装 Wrangler
npm i -g wrangler

# 部署
wrangler pages project create plotcraft
wrangler pages deploy dist
```

## Railway

```bash
# 安装 Railway CLI
npm i -g @railway/cli

# 登录
railway login

# 初始化
railway init

# 部署
railway up
```

## Render

1. 在 [render.com](https://render.com) 连接 GitHub 仓库
2. 选择 "Static Site"
3. 配置：
   - **构建命令**：`npm run build`
   - **发布目录**：`dist`

## Fly.io

```bash
# 安装 Fly CLI
brew install flyctl

# 登录
fly auth login

# 启动
fly launch

# 部署
fly deploy
```

## 安全注意事项

### 生产检查清单

- [ ] HTTPS 已启用（所有平台都提供）
- [ ] API 密钥在环境变量中，不在代码中
- [ ] API 端点已配置速率限制
- [ ] Content Security Policy 头已配置
- [ ] CORS 配置正确
- [ ] 客户端包中无敏感数据

### 后端代理（推荐）

对于生产环境 Web 应用，使用后端代理处理 AI API 调用：

```nginx
# nginx.conf
server {
  listen 80;
  server_name api.plotcraft.example.com;

  location / {
    proxy_pass https://api.alibaba.com;
    proxy_set_header Authorization "Bearer $ALIBABA_API_KEY";
  }
}
```

## 监控

### 运行时间监控

- 使用 Better Uptime、Pingometer 或 Grafana 等服务

### 性能监控

- Vercel Analytics（内置）
- Cloudflare Analytics
- Datadog

### 错误跟踪

- Sentry
- LogRocket
- Datadog APM
