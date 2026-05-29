# 部署文档

本文档详细介绍 PanelFlow 系统的部署方式、配置要求和运维指南。

---

## 一、部署架构

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PanelFlow 部署架构                              │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │   Users     │
                              └──────┬──────┘
                                     │
                                     ▼
                         ┌─────────────────────┐
                         │   Load Balancer     │
                         │   (Nginx / Traefik) │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │   Web UI Pod    │   │   Web UI Pod    │   │   Web UI Pod    │
    │  (React Frontend)│   │  (React Frontend)│   │  (React Frontend)│
    └────────┬────────┘   └────────┬────────┘   └────────┬────────┘
             │                     │                     │
             └─────────────────────┼─────────────────────┘
                                   │
                         ┌─────────┴─────────┐
                         │  API Gateway      │
                         │  (Node.js / Express)│
                         └─────────┬─────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │  Core API Pod   │   │  Core API Pod   │   │  Core API Pod   │
    │                 │   │                 │   │                 │
    └────────┬────────┘   └────────┬────────┘   └────────┬────────┘
             │                    │                    │
             └────────────────────┼────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ Redis Cluster │       │  PostgreSQL   │       │  File Storage │
│   (Cache &    │       │  (Metadata)   │       │  (MinIO / S3) │
│   Sessions)   │       │               │       │               │
└───────────────┘       └───────────────┘       └───────────────┘
```

### 1.2 组件说明

| 组件           | 说明         | 数量       | 资源需求        |
| -------------- | ------------ | ---------- | --------------- |
| React Frontend | 前端 UI      | 2-3 个副本 | 1 CPU, 1GB RAM  |
| API Gateway    | API 网关     | 2-3 个副本 | 2 CPU, 2GB RAM  |
| Core API       | 核心业务服务 | 3-5 个副本 | 4 CPU, 8GB RAM  |
| Redis          | 缓存与会话   | 3 节点集群 | 2 CPU, 4GB RAM  |
| PostgreSQL     | 元数据存储   | 主从架构   | 4 CPU, 16GB RAM |
| MinIO/S3       | 文件存储     | 4 节点     | 4 CPU, 8GB RAM  |

---

## 二、环境要求

### 2.1 硬件要求

**开发/测试环境**:

| 组件     | CPU  | 内存 | 存储  |
| -------- | ---- | ---- | ----- |
| 应用服务 | 2 核 | 4 GB | 20 GB |
| 数据库   | 2 核 | 4 GB | 50 GB |

**生产环境（单副本基准）**:

| 组件        | CPU  | 内存  | 存储    |
| ----------- | ---- | ----- | ------- |
| Web UI      | 2 核 | 2 GB  | 10 GB   |
| API Gateway | 2 核 | 2 GB  | 10 GB   |
| Core API    | 4 核 | 8 GB  | 20 GB   |
| Redis       | 2 核 | 4 GB  | 10 GB   |
| PostgreSQL  | 4 核 | 16 GB | 100 GB  |
| MinIO       | 4 核 | 8 GB  | 500 GB+ |

### 2.2 软件要求

| 软件       | 版本           | 说明             |
| ---------- | -------------- | ---------------- |
| Node.js    | ≥ 20.x         | 后端运行环境     |
| PostgreSQL | ≥ 15.x         | 元数据存储       |
| Redis      | ≥ 7.x          | 缓存与会话存储   |
| FFmpeg     | ≥ 6.x          | 视频处理         |
| Docker     | ≥ 24.x         | 容器化部署       |
| Kubernetes | ≥ 1.28         | 容器编排（可选） |
| MinIO      | ≥ RELEASE.2024 | 对象存储         |

### 2.3 浏览器支持

| 浏览器  | 最低版本 |
| ------- | -------- |
| Chrome  | 90+      |
| Firefox | 88+      |
| Safari  | 14+      |
| Edge    | 90+      |

---

## 三、部署方式

### 3.1 Docker Compose 部署（开发/测试环境）

#### 目录结构

```
panel-deck/
├── docker-compose.yml
├── .env
├── services/
│   ├── app/
│   │   ├── Dockerfile
│   │   └── ...
│   ├── postgres/
│   ├── redis/
│   └── minio/
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  # 前端应用
  frontend:
    build:
      context: ./services/app
      dockerfile: Dockerfile.frontend
    ports:
      - '3000:3000'
    environment:
      - REACT_APP_API_URL=http://localhost:4000/api
    depends_on:
      - api
    networks:
      - panel-network

  # 后端 API
  api:
    build:
      context: ./services/app
      dockerfile: Dockerfile.api
    ports:
      - '4000:4000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://paneluser:panelpass@postgres:5432/panelflow
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin
    depends_on:
      - postgres
      - redis
      - minio
    networks:
      - panel-network
    volumes:
      - ./output:/app/output

  # PostgreSQL 数据库
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=paneluser
      - POSTGRES_PASSWORD=panelpass
      - POSTGRES_DB=panelflow
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    networks:
      - panel-network

  # Redis 缓存
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    networks:
      - panel-network

  # MinIO 对象存储
  minio:
    image: minio/minio:latest
    ports:
      - '9000:9000'
      - '9001:9001'
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio-data:/data
    networks:
      - panel-network

volumes:
  postgres-data:
  redis-data:
  minio-data:

networks:
  panel-network:
    driver: bridge
```

#### 启动服务

```bash
# 克隆项目
git clone https://github.com/Agions/panel-deck.git
cd panel-deck

# 创建环境配置文件
cp .env.example .env

# 编辑 .env 文件配置必要的环境变量

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f api
```

### 3.2 Kubernetes 部署（生产环境）

#### 前提条件

- Kubernetes 集群（1.28+）
- Helm 3.x
- Ingress Controller（如 nginx-ingress）
- Cert-Manager（用于 TLS 证书）

#### 使用 Helm 部署

```bash
# 添加 Helm 仓库
helm repo add panelflow https://charts.panelflow.com
helm repo update

# 创建命名空间
kubectl create namespace panelflow

# 安装 PanelFlow
helm install panelflow panelflow/panelflow \
  --namespace panelflow \
  --set global.domain=panelflow.example.com \
  --set global.tls.enabled=true \
  --set postgres.enabled=true \
  --set redis.enabled=true \
  --set minio.enabled=true
```

#### 高可用配置

```yaml
# values-ha.yaml
replicaCount: 3

resources:
  limits:
    cpu: 4000m
    memory: 8Gi
  requests:
    cpu: 2000m
    memory: 4Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

persistence:
  enabled: true
  size: 100Gi
  storageClass: fast-ssd

postgres:
  replicaCount: 2
  resources:
    limits:
      cpu: 4000m
      memory: 16Gi

redis:
  cluster:
    enabled: true
    nodes: 3
```

---

## 四、环境配置

### 4.1 环境变量

#### 必需配置

```bash
# 应用配置
NODE_ENV=production
PORT=4000
LOG_LEVEL=info

# 数据库配置
DATABASE_URL=postgresql://user:password@host:5432/panelflow
DATABASE_POOL_SIZE=20

# Redis 配置
REDIS_URL=redis://host:6379
REDIS_PASSWORD=

# 对象存储配置
MINIO_ENDPOINT=minio.example.com
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=panelflow-output
MINIO_USE_SSL=true

# AI 服务配置
LLM_PROVIDER=glm
LLM_API_KEY=your_llm_api_key
IMAGE_PROVIDER=seedream
IMAGE_API_KEY=your_image_api_key
TTS_PROVIDER=edge

# JWT 配置
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d

# FFmpeg 配置
FFMPEG_PATH=/usr/local/bin/ffmpeg
MAX_CONCURRENT_RENDERS=4
RENDER_BATCH_SIZE=4
```

#### 可选配置

```bash
# CORS 配置
CORS_ORIGIN=https://panelflow.example.com

# 限流配置
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# Webhook 配置
WEBHOOK_URL=https://your-webhook-server.com/webhook
WEBHOOK_SECRET=your_webhook_secret

# 监控配置
METRICS_ENABLED=true
METRICS_PORT=9090
```

### 4.2 配置文件

**config/production.json**:

```json
{
  "server": {
    "port": 4000,
    "host": "0.0.0.0",
    "trustProxy": true
  },
  "database": {
    "pool": {
      "min": 5,
      "max": 20
    },
    "ssl": {
      "enabled": true,
      "ca": "/etc/secrets/db-ca.pem"
    }
  },
  "redis": {
    "cluster": {
      "enabled": false
    },
    "sentinel": {
      "enabled": false
    }
  },
  "storage": {
    "provider": "minio",
    "bucket": "panelflow-output",
    "presignedUrlExpiry": 3600
  },
  "ai": {
    "retry": {
      "maxAttempts": 3,
      "backoffMs": 1000
    },
    "timeout": 120000
  },
  "video": {
    "ffmpeg": {
      "threads": 4
    },
    "output": {
      "maxDuration": 1800,
      "maxFileSize": 1073741824
    }
  }
}
```

---

## 五、数据存储

### 5.1 PostgreSQL Schema

```sql
-- 任务表
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'idle',
    mode VARCHAR(50) NOT NULL,
    style VARCHAR(50),
    current_step VARCHAR(50),
    progress INTEGER DEFAULT 0,
    input_content TEXT,
    output_path VARCHAR(500),
    error JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 任务步骤状态表
CREATE TABLE task_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    step_id VARCHAR(50) NOT NULL,
    step_name VARCHAR(100),
    status VARCHAR(50) NOT NULL,
    progress INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    output JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    name VARCHAR(100),
    description TEXT,
    appearance JSONB,
    image_paths TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_task_steps_task_id ON task_steps(task_id);
CREATE INDEX idx_characters_task_id ON characters(task_id);
```

### 5.2 Redis 数据结构

```typescript
// 任务状态缓存
Key: task:${taskId}:status
Type: Hash
TTL: 24h
Fields: { status, currentStep, progress, updatedAt }

// 步骤输出缓存
Key: task:${taskId}:step:${stepId}:output
Type: String (JSON)
TTL: 7d

// 会话管理
Key: session:${sessionId}
Type: Hash
TTL: 7d

// 限流计数
Key: ratelimit:${userId}:${endpoint}
Type: String (counter)
TTL: 60s
```

### 5.3 对象存储结构

```
panelflow-output/
├── tasks/
│   ├── ${taskId}/
│   │   ├── final.mp4              # 最终视频
│   │   ├── thumbnail.jpg          # 缩略图
│   │   ├── characters/            # 角色图片
│   │   │   ├── character_1.png
│   │   │   └── character_2.png
│   │   ├── storyboards/          # 分镜图片
│   │   │   ├── scene_001.png
│   │   │   └── scene_002.png
│   │   ├── audio/                 # 音频文件
│   │   │   ├── dialogue_001.mp3
│   │   │   └── background.mp3
│   │   └── subtitles/
│   │       └── subtitles.srt
│   └── ...
└── temp/
    └── ${taskId}/                  # 临时文件
```

---

## 六、运维指南

### 6.1 监控

#### 关键指标

| 指标             | 说明           | 告警阈值 |
| ---------------- | -------------- | -------- |
| API 响应时间 P99 | API 端到端延迟 | > 2s     |
| 错误率           | 5xx 错误占比   | > 1%     |
| CPU 使用率       | 容器 CPU       | > 80%    |
| 内存使用率       | 容器内存       | > 85%    |
| 任务队列长度     | 待处理任务     | > 100    |
| 存储使用率       | 磁盘空间       | > 80%    |

#### Prometheus 指标

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'panelflow'
    static_configs:
      - targets: ['api:9090']
    metrics_path: /metrics
```

### 6.2 日志管理

```yaml
# fluentd-config.yaml
<source>
@type tail
path /var/log/panelflow/*.log
pos_file /var/log/panelflow/log.pos
tag panelflow.app
<parse>
@type json
</parse>
</source>

<match panelflow.app>
@type elasticsearch
host elasticsearch.example.com
port 9200
logstash_format true
logstash_prefix panelflow
</match>
```

### 6.3 备份策略

```bash
#!/bin/bash
# backup.sh

# 数据库备份
pg_dump -h postgres -U paneluser -d panelflow | gzip > backup/db_$(date +%Y%m%d).sql.gz

# MinIO 备份（使用 mc）
mc mirror panelflow-output/ panelflow-backup/$(date +%Y%m%d)/

# Redis 持久化
redis-cli BGSAVE
```

**备份频率**:

| 数据类型   | 频率   | 保留时间 |
| ---------- | ------ | -------- |
| 数据库全量 | 每日   | 30 天    |
| 增量备份   | 每小时 | 7 天     |
| 文件存储   | 每日   | 14 天    |

### 6.4 灾难恢复

```yaml
# recovery-runbook.md
## 数据库恢复
1. 停止应用服务
2. 从备份恢复: pg_restore -h postgres -U paneluser -d panelflow backup/db_xxx.sql.gz
3. 验证数据完整性
4. 重启应用服务

## 对象存储恢复
1. 从备份复制: mc cp panelflow-backup/2024-xx-xx/ panelflow-output/
2. 验证文件完整性
3. 重新触发失败任务
```

### 6.5 扩缩容

```bash
# 手动扩缩容
kubectl scale deployment panelflow-api --replicas=5 -n panelflow

# 自动扩缩容配置
kubectl autoscale deployment panelflow-api \
  --min=3 \
  --max=10 \
  --cpu-percent=70 \
  -n panelflow
```

---

## 七、安全配置

### 7.1 TLS 配置

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name panelflow.example.com;

    ssl_certificate /etc/ssl/certs/panelflow.crt;
    ssl_certificate_key /etc/ssl/private/panelflow.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000" always;
}
```

### 7.2 防火墙规则

```bash
# iptables 规则示例
# 允许 HTTP/HTTPS
-A INPUT -p tcp --dport 80 -j ACCEPT
-A INPUT -p tcp --dport 443 -j ACCEPT

# 允许数据库访问（仅内网）
-A INPUT -p tcp -s 10.0.0.0/16 --dport 5432 -j ACCEPT

# 允许 Redis 访问（仅内网）
-A INPUT -p tcp -s 10.0.0.0/16 --dport 6379 -j ACCEPT

# 拒绝其他访问
-A INPUT -j DROP
```

### 7.3 Secret 管理

```bash
# 使用 Kubernetes Secret
kubectl create secret generic panelflow-secrets \
  --from-literal=LLM_API_KEY=xxx \
  --from-literal=JWT_SECRET=xxx \
  --namespace panelflow

# 使用 HashiCorp Vault
vault kv put secret/panelflow \
  LLM_API_KEY=xxx \
  IMAGE_API_KEY=xxx
```

---

## 八、性能优化

### 8.1 数据库优化

```sql
-- 连接池配置
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;

-- 查询优化
CREATE INDEX CONCURRENTLY idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX CONCURRENTLY idx_task_steps_status ON task_steps(task_id, status);
```

### 8.2 Redis 优化

```redis
# redis.conf 优化
tcp-backlog 511
timeout 60
tcp-keepalive 300
maxmemory 2gb
maxmemory-policy allkeys-lru

# 持久化策略
save 900 1
save 300 10
save 60 10000
```

### 8.3 视频处理优化

```yaml
# ffmpeg 硬件加速配置
video:
  hardwareAcceleration:
    enabled: true
    encoder: h264_nvenc # NVIDIA GPU
    # 或 h264_qsv (Intel QuickSync)
    # 或 h264_videotoolbox (Apple Silicon)
```

---

## 九、故障排查

### 9.1 常见问题

| 问题         | 可能原因                  | 解决方案              |
| ------------ | ------------------------- | --------------------- |
| API 响应慢   | 数据库连接池满、CPU 过高  | 增加实例数、优化查询  |
| 任务卡死     | Redis 连接断开            | 检查网络、重启服务    |
| 视频渲染失败 | FFmpeg 配置错误、内存不足 | 检查 FFmpeg、日志     |
| 存储访问失败 | MinIO 服务异常            | 检查 MinIO 状态、网络 |

### 9.2 健康检查

```bash
# API 健康检查
curl -f https://api.panelflow.com/health

# 数据库连接检查
kubectl exec -it panelflow-api-xxx -- nslookup postgres

# Redis 连接检查
kubectl exec -it panelflow-api-xxx -- redis-cli -h redis ping
```

---

## 十、更新升级

### 10.1 版本升级流程

```bash
# 1. 备份当前版本
kubectl get deployment panelflow-api -o yaml > backup/api-deployment.yaml

# 2. 更新 Helm chart
helm repo update
helm upgrade panelflow panelflow/panelflow \
  --version 2.0.0 \
  --namespace panelflow

# 3. 验证新版本
kubectl rollout status deployment/panelflow-api -n panelflow

# 4. 回滚（如有问题）
kubectl rollout undo deployment/panelflow-api -n panelflow
```

### 10.2 数据库迁移

```bash
# 运行数据库迁移
kubectl exec -it panelflow-api-xxx -- npm run db:migrate

# 或使用 Flyway
kubectl exec -it panelflow-api-xxx -- flyway -url=jdbc:postgresql://postgres/panelflow migrate
```
