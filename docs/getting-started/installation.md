# 安装指南

本文档详细介绍 FrameForge 的安装和部署过程，包括本地开发和 Docker 部署两种方式。

---

## 前置要求

### 硬件要求

| 组件 | 最低要求       | 推荐配置     |
| ---- | -------------- | ------------ |
| 内存 | 8 GB           | 16 GB 或以上 |
| 存储 | 10 GB 可用空间 | 50 GB SSD    |
| 网络 | 稳定的外网连接 | 宽带         |

### 软件要求

| 软件           | 版本要求   | 说明               |
| -------------- | ---------- | ------------------ |
| Node.js        | ≥ 18.0     | 推荐使用 LTS 版本  |
| npm            | ≥ 9.0      | 或使用 pnpm/yarn   |
| Git            | 最新稳定版 | 用于代码克隆       |
| Docker         | ≥ 20.10    | 仅 Docker 部署需要 |
| Docker Compose | ≥ 2.0      | 仅 Docker 部署需要 |

### 浏览器要求

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 本地开发安装

### 步骤 1：克隆代码仓库

```bash
git clone https://github.com/Agions/frame-forge.git
cd frame-forge
```

### 步骤 2：安装依赖

```bash
pnpm install
```

### 步骤 3：配置文件

复制环境变量模板文件：

```bash
cp .env.example .env.local
```

然后编辑 `.env.local`，配置您的 AI API Key。详见 [配置 AI API Key](./configuration.md)。

### 步骤 4：启动开发服务器

```bash
npm run dev
```

等待终端输出类似以下信息：

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

在浏览器中打开 `http://localhost:5173` 即可访问。

### 步骤 5：验证安装

访问服务健康检查端点，确认所有服务状态正常。

---

## 生产环境部署

### 方式一：Docker 部署（推荐）

#### 步骤 1：准备环境

确保已安装 Docker 和 Docker Compose：

```bash
docker --version
docker compose version
```

#### 步骤 2：配置文件

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置生产环境所需的 API Key。

#### 步骤 3：构建并启动

```bash
docker compose up -d
```

#### 步骤 4：验证服务

```bash
docker compose ps
docker compose logs -f frame-forge
```

服务启动后，访问 `http://localhost:3000`。

#### 步骤 5：停止服务

```bash
docker compose down
```

如需完全清理：

```bash
docker compose down -v
```

### 方式二：手动部署

#### 步骤 1：安装 Node.js 生产依赖

```bash
npm install --production
```

#### 步骤 2：构建应用

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

#### 步骤 3：启动生产服务器

```bash
npm run start
```

#### 步骤 4：配置反向代理（可选）

推荐使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Docker 部署详解

### docker-compose.yml 结构

```yaml
services:
  frame-forge:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    restart: unless-stopped
    volumes:
      - ./data:/app/data
```

### 自定义配置

#### 修改端口

编辑 `docker-compose.yml`：

```yaml
ports:
  - '8080:3000' # 改为 8080
```

#### 数据持久化

默认情况下，容器内的数据在删除后会丢失。如需持久化，配置 volume：

```yaml
volumes:
  - frame-forge-data:/app/data

volumes:
  frame-forge-data:
    driver: local
```

#### 环境变量配置

在 `.env` 文件中配置：

```env
NODE_ENV=production
PORT=3000
```

### 使用 Nginx + Docker 部署

#### 1. 创建 Nginx 配置

```nginx
# /etc/nginx/conf.d/frame-forge.conf
upstream panel_flow {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://panel_flow;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 2. 启动服务

```bash
docker compose up -d
sudo nginx -t
sudo systemctl restart nginx
```

---

## 常见问题

**Q: npm install 失败怎么办？**

尝试清除缓存后重试：

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Q: Docker 构建失败？**

确保 Docker 版本符合要求，且网络连接正常。可使用国内镜像：

```bash
# /etc/docker/daemon.json
{
  "registry-mirrors": ["https://docker.mirrors.ustc.edu.cn"]
}
```

**Q: 端口被占用？**

修改 `docker-compose.yml` 中的端口映射，或停止占用端口的其他服务。

**Q: 生产环境启动后页面空白？**

检查是否正确执行了 `npm run build`，以及 `.env` 中的 `NODE_ENV=production` 配置。

---

## 下一步

安装完成后，建议您：

1. [配置 AI API Key](./configuration.md) - 配置您要使用的 AI 服务
2. [快速开始](../user-guide/workflow-overview.md) - 了解基本使用流程
3. [自主模式指南](../user-guide/auto-mode.md) - 体验全自动制作流程
