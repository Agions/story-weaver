# Docker

panel-flow 的 Docker 部署。

## 快速开始

```bash
docker build -t panelflow .
docker run -p 8080:80 panelflow
```

## Docker Compose

```yaml
version: '3.8'
services:
  panelflow:
    build: .
    ports:
      - '8080:80'
    environment:
      - VITE_APP_MODE=web
      - VITE_MINIMAX_API_KEY=your_key
    restart: unless-stopped
```

## 多阶段构建

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 环境变量

```bash
# 构建时
docker build --build-arg VITE_MINIMAX_API_KEY=your_key -t panelflow .

# 运行时
docker run -p 8080:80 --env-file .env panelflow
```
