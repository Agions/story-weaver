# Security Policy

> frame-fab 项目的安全策略与漏洞披露流程

## Supported Versions

当前支持的安全更新版本：

| Version | Supported        |
| ------- | ---------------- |
| 3.0.x   | ✅ Active        |
| 2.4.x   | ✅ Active        |
| 2.3.x   | ⚠️ Critical only |
| < 2.3   | ❌ End of life   |

## Reporting a Vulnerability

**请勿在 GitHub Issues 公开披露安全漏洞喵～**

### 推荐流程

1. **私有披露**：通过 [GitHub Security Advisories](https://github.com/Agions/frame-fab/security/advisories/new) 提交
2. **邮件**：security@frame-fab.dev（备用渠道）
3. **包含信息**：
   - 漏洞描述与影响范围
   - 复现步骤（PoC）
   - 受影响版本
   - 建议的修复方案（可选）

### 响应时间承诺

| 阶段         | 时限             |
| ------------ | ---------------- |
| 初次确认     | 48 小时内        |
| 严重漏洞修复 | 7 天内           |
| 一般漏洞修复 | 30 天内          |
| 公开披露     | 修复发布后 90 天 |

## 安全设计原则

frame-fab 在设计层面遵循以下安全原则：

### 1. 数据本地化（Data Locality）

- ✅ **项目数据、API Key 全部本地存储**，不上传任何服务器
- ✅ 使用 Tauri `path` 白名单限制文件 I/O 范围
- ✅ localStorage 加密敏感字段（API Key）

### 2. 依赖最小化

- ✅ Rust 端无 unsafe 代码块（除必要 FFI）
- ✅ npm 依赖锁定 `pnpm-lock.yaml`，CI 验证
- ✅ 定期 `pnpm audit` 检查 CVE

### 3. 供应链安全

- ✅ Tauri 2.1 官方签名验证
- ✅ FFmpeg 子进程通过白名单 binary 路径调用
- ✅ AI Provider 请求走 HTTPS，含证书钉扎

### 4. 沙箱化（已规划 v3.1）

- 🔄 Tauri Capability 模型细化（v3.1）
- 🔄 IPC 调用签名校验
- 🔄 用户态 WebView 沙箱强化

## 已知安全边界

### 桌面端

- ❌ **不上传用户内容** 到 frame-fab 官方服务器（无服务器）
- ⚠️ **AI Provider 调用**：由用户配置 API Key，请求直发 Provider
- ⚠️ **本地文件访问**：Tauri path 白名单限定

### 浏览器/Web 模式

- ⚠️ 部分高级功能（视频合成）需要 Tauri 桌面端
- Web 模式下 API Key 仅存于浏览器 localStorage

## 致谢

报告安全漏洞的所有贡献者将在修复发布后致谢（可选择匿名）。

感谢您帮助 frame-fab 变得安全喵～(=^･ω･^=)
