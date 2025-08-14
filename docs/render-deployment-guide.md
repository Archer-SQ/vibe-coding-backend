# Render部署指南

手势飞机大战后端服务 - Render平台部署完整指南

## 📋 目录

- [概述](#概述)
- [前置条件](#前置条件)
- [快速部署](#快速部署)
- [详细步骤](#详细步骤)
- [环境变量配置](#环境变量配置)
- [部署验证](#部署验证)
- [常见问题](#常见问题)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)

## 🎯 概述

本指南将帮助您将手势飞机大战后端服务部署到Render平台。Render是一个现代化的云平台，提供自动化部署、扩缩容和监控功能。

### 部署架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub仓库    │───▶│   Render平台    │───▶│   生产环境      │
│                 │    │                 │    │                 │
│ • 源代码        │    │ • 自动构建      │    │ • Web服务       │
│ • render.yaml   │    │ • 环境变量      │    │ • 健康检查      │
│ • 部署脚本      │    │ • 日志监控      │    │ • 自动扩缩容    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲
                                │
                       ┌─────────────────┐
                       │   外部服务      │
                       │                 │
                       │ • MongoDB Atlas │
                       │ • Upstash Redis │
                       │ • Sentry监控    │
                       └─────────────────┘
```

## ✅ 前置条件

### 1. 账户准备

- [x] **GitHub账户**：用于代码托管
- [x] **Render账户**：[注册地址](https://render.com)
- [x] **MongoDB Atlas账户**：[注册地址](https://www.mongodb.com/cloud/atlas)
- [x] **Upstash账户**：[注册地址](https://upstash.com)（可选，用于Redis缓存）

### 2. 本地环境

- [x] **Node.js 18+**：运行时环境
- [x] **pnpm**：包管理器
- [x] **Git**：版本控制
- [x] **代码编辑器**：VS Code推荐

### 3. 项目准备

- [x] **项目代码**：完整的后端项目
- [x] **环境变量**：配置文件准备
- [x] **数据库**：MongoDB Atlas集群
- [x] **测试通过**：本地测试验证

## 🚀 快速部署

### 一键部署脚本

```bash
# 1. 运行部署脚本
pnpm run deploy:render

# 2. 按照提示完成Render控制台配置
# 3. 等待部署完成
```

### 手动部署步骤

1. **推送代码到GitHub**
2. **登录Render控制台**
3. **创建Web Service**
4. **配置环境变量**
5. **触发部署**

## 📝 详细步骤

### 步骤1：准备代码仓库

#### 1.1 确保代码最新

```bash
# 检查Git状态
git status

# 提交所有更改
git add .
git commit -m "feat: 准备Render部署配置"

# 推送到main分支
git push origin main
```

#### 1.2 验证部署文件

确保以下文件存在且配置正确：

- [x] `render.yaml` - Render配置文件
- [x] `package.json` - 包含部署脚本
- [x] `.env.render` - 环境变量模板
- [x] `scripts/deploy-render.sh` - 部署脚本

### 步骤2：创建Render服务

#### 2.1 登录Render控制台

1. 访问 [Render Dashboard](https://dashboard.render.com)
2. 使用GitHub账户登录
3. 授权Render访问您的GitHub仓库

#### 2.2 创建新的Web Service

1. 点击 **"New +"** 按钮
2. 选择 **"Web Service"**
3. 连接GitHub仓库：
   - 选择您的GitHub账户
   - 找到 `vibe-coding-backend` 仓库
   - 点击 **"Connect"**

#### 2.3 配置服务设置

**基本设置：**

| 配置项 | 值 | 说明 |
|--------|----|---------|
| Name | `vibe-coding-backend` | 服务名称 |
| Region | `Oregon (US West)` | 部署区域 |
| Branch | `main` | 部署分支 |
| Runtime | `Node` | 运行时环境 |

**构建设置：**

| 配置项 | 值 | 说明 |
|--------|----|---------|
| Build Command | `pnpm install && pnpm run build` | 构建命令 |
| Start Command | `pnpm start` | 启动命令 |

**高级设置：**

- [x] **Auto-Deploy**: `Yes` - 启用自动部署
- [x] **Health Check Path**: `/health` - 健康检查路径

### 步骤3：配置环境变量

#### 3.1 必需环境变量

在Render控制台的 **Environment** 标签页中添加以下变量：

```bash
# MongoDB配置
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gamedb?retryWrites=true&w=majority
MONGODB_DB_NAME=gamedb

# Redis配置（可选）
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# 应用配置
NODE_ENV=production
PORT=10000
```

#### 3.2 可选环境变量

```bash
# 错误监控
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# 功能开关
ENABLE_ANALYTICS=true
ENABLE_CACHE=true
DEBUG_MODE=false

# 安全配置
CORS_ORIGIN=*
API_RATE_LIMIT=100
```

#### 3.3 环境变量获取指南

**MongoDB Atlas连接字符串：**

1. 登录 [MongoDB Atlas](https://cloud.mongodb.com)
2. 选择您的集群
3. 点击 **"Connect"**
4. 选择 **"Connect your application"**
5. 复制连接字符串并替换密码

**Upstash Redis配置：**

1. 登录 [Upstash Console](https://console.upstash.com)
2. 创建新的Redis数据库
3. 在 **"Details"** 页面获取REST URL和Token

### 步骤4：部署服务

#### 4.1 触发首次部署

1. 在Render控制台点击 **"Create Web Service"**
2. 等待部署开始（通常需要2-5分钟）
3. 监控部署日志

#### 4.2 验证部署状态

**部署日志示例：**

```
==> Cloning from https://github.com/your-username/vibe-coding-backend...
==> Using Node version 18.18.0 (default)
==> Running build command 'pnpm install && pnpm run build'...
    ✓ Dependencies installed
    ✓ TypeScript compiled
==> Running start command 'pnpm start'...
    🚀 Starting Vibe Coding Backend...
    ✅ MongoDB连接成功
    ✅ Redis连接成功
    🌐 Server running on port 10000
==> Your service is live 🎉
```

## 🔧 环境变量配置

### 配置优先级

1. **Render控制台设置** - 最高优先级
2. **render.yaml文件** - 中等优先级
3. **代码默认值** - 最低优先级

### 敏感信息处理

**✅ 推荐做法：**

- 在Render控制台设置敏感环境变量
- 使用强密码和复杂令牌
- 定期轮换密钥
- 启用两步验证

**❌ 避免做法：**

- 将密钥提交到代码仓库
- 使用弱密码
- 在日志中输出敏感信息
- 共享生产环境密钥

### 环境变量验证

```bash
# 本地验证脚本
node -e "
console.log('🔍 环境变量检查:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ 已设置' : '❌ 未设置');
console.log('REDIS_URL:', process.env.UPSTASH_REDIS_REST_URL ? '✅ 已设置' : '⚠️ 未设置（可选）');
"
```

## ✅ 部署验证

### 自动化验证

```bash
# 运行部署检查
pnpm run deploy:check

# 健康检查
curl -f https://your-app.onrender.com/health
```

### 手动验证步骤

#### 1. 服务状态检查

- [x] **服务运行状态**: 绿色（Running）
- [x] **健康检查**: 通过
- [x] **日志无错误**: 检查部署日志
- [x] **内存使用**: 正常范围内

#### 2. API功能测试

```bash
# 基础健康检查
curl https://your-app.onrender.com/health

# 游戏API测试
curl -X POST https://your-app.onrender.com/api/game/submit \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test123","score":1000}'

# 排行榜API测试
curl https://your-app.onrender.com/api/game/ranking
```

#### 3. 数据库连接验证

- [x] **MongoDB连接**: 检查连接日志
- [x] **Redis连接**: 验证缓存功能
- [x] **数据读写**: 测试CRUD操作

### 性能基准测试

```bash
# 使用Apache Bench进行压力测试
ab -n 1000 -c 10 https://your-app.onrender.com/health

# 预期结果：
# - 响应时间 < 200ms
# - 成功率 > 99%
# - 无内存泄漏
```

## 🔍 监控和维护

### Render内置监控

**可用指标：**

- **CPU使用率**: 监控处理器负载
- **内存使用**: 跟踪内存消耗
- **响应时间**: API响应延迟
- **错误率**: 4xx/5xx错误统计
- **请求量**: QPS和总请求数

**告警设置：**

1. 进入Render控制台
2. 选择您的服务
3. 点击 **"Metrics"** 标签
4. 配置告警阈值：
   - CPU > 80%
   - 内存 > 90%
   - 错误率 > 5%
   - 响应时间 > 1000ms

### 日志管理

**日志查看：**

```bash
# 实时日志
render logs --tail

# 历史日志
render logs --since 1h

# 错误日志过滤
render logs --filter "ERROR"
```

**日志级别配置：**

```javascript
// 生产环境日志配置
const logLevel = process.env.LOG_LEVEL || 'info';

// 日志级别：error < warn < info < debug
```

### 自动扩缩容

**Render自动扩缩容特性：**

- **水平扩展**: 根据负载自动增减实例
- **垂直扩展**: 根据需求调整资源配置
- **零停机部署**: 滚动更新保证服务可用性

**扩缩容配置：**

```yaml
# render.yaml中的扩缩容设置
services:
  - type: web
    name: vibe-coding-backend
    scaling:
      minInstances: 1
      maxInstances: 3
      targetCPU: 70
      targetMemory: 80
```

## 🛠️ 故障排除

### 常见问题及解决方案

#### 1. 部署失败

**问题症状：**
- 构建过程中断
- 依赖安装失败
- TypeScript编译错误

**解决步骤：**

```bash
# 1. 检查本地构建
pnpm run build

# 2. 验证依赖
pnpm install --frozen-lockfile

# 3. 检查TypeScript配置
pnpm run type-check

# 4. 查看详细错误日志
render logs --filter "ERROR"
```

#### 2. 数据库连接失败

**问题症状：**
- MongoDB连接超时
- 认证失败
- 网络连接错误

**解决步骤：**

```bash
# 1. 验证连接字符串
node -e "console.log(process.env.MONGODB_URI)"

# 2. 检查IP白名单
# 在MongoDB Atlas中添加 0.0.0.0/0

# 3. 测试连接
node scripts/test-db-connection.js

# 4. 检查网络配置
ping cluster0.mongodb.net
```

#### 3. 服务启动失败

**问题症状：**
- 端口绑定失败
- 环境变量缺失
- 依赖模块错误

**解决步骤：**

```bash
# 1. 检查端口配置
echo $PORT  # 应该是10000

# 2. 验证环境变量
node -e "console.log(Object.keys(process.env).filter(k => k.includes('MONGO')))"

# 3. 检查依赖
pnpm list --depth=0

# 4. 本地模拟生产环境
NODE_ENV=production pnpm start
```

#### 4. 性能问题

**问题症状：**
- 响应时间过长
- 内存使用过高
- CPU占用率高

**解决步骤：**

```bash
# 1. 性能分析
node --inspect app.ts

# 2. 内存分析
node --max-old-space-size=512 app.ts

# 3. 数据库查询优化
# 检查MongoDB慢查询日志

# 4. 启用缓存
ENABLE_CACHE=true
```

### 紧急恢复流程

#### 1. 服务回滚

```bash
# 1. 在Render控制台找到上一个成功的部署
# 2. 点击 "Redeploy" 按钮
# 3. 等待回滚完成
# 4. 验证服务恢复正常
```

#### 2. 数据库恢复

```bash
# 1. 检查MongoDB Atlas备份
# 2. 如需要，从备份恢复数据
# 3. 验证数据完整性
# 4. 重启应用服务
```

#### 3. 联系支持

**Render支持渠道：**
- 📧 **邮件支持**: support@render.com
- 💬 **在线聊天**: Render控制台右下角
- 📚 **文档中心**: https://render.com/docs
- 🐛 **状态页面**: https://status.render.com

## 📚 相关资源

### 官方文档

- [Render官方文档](https://render.com/docs)
- [Node.js部署指南](https://render.com/docs/deploy-node-express-app)
- [环境变量管理](https://render.com/docs/environment-variables)
- [自定义域名](https://render.com/docs/custom-domains)

### 项目文档

- [API文档](./api-documentation.md)
- [数据库设计](./database-design.md)
- [开发指南](../README.md)
- [故障排除](./troubleshooting.md)

### 工具和资源

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Upstash Redis](https://upstash.com)
- [Sentry错误监控](https://sentry.io)
- [Render CLI工具](https://render.com/docs/cli)

## 🎯 最佳实践

### 部署流程

1. **开发环境测试** → 本地验证功能
2. **预生产验证** → 模拟生产环境
3. **自动化测试** → CI/CD流水线
4. **生产部署** → 监控和验证
5. **后部署验证** → 功能和性能测试

### 安全建议

- 🔐 **使用强密码**：数据库和API密钥
- 🛡️ **启用HTTPS**：Render自动提供SSL证书
- 🚫 **限制CORS**：配置允许的域名
- 📊 **监控异常**：设置错误告警
- 🔄 **定期更新**：依赖包和安全补丁

### 性能优化

- ⚡ **启用缓存**：Redis缓存热点数据
- 📦 **代码分割**：按需加载模块
- 🗜️ **启用压缩**：gzip压缩响应
- 📈 **数据库优化**：索引和查询优化
- 🔄 **连接池**：复用数据库连接

### 监控策略

- 📊 **关键指标**：响应时间、错误率、吞吐量
- 🚨 **告警设置**：及时发现问题
- 📝 **日志管理**：结构化日志记录
- 🔍 **性能分析**：定期性能评估
- 📈 **容量规划**：预测资源需求

---

## 📞 支持和反馈

如果您在部署过程中遇到问题，请通过以下方式获取帮助：

- 📧 **技术支持**: dev@vibe-coding.com
- 🐛 **问题报告**: [GitHub Issues](https://github.com/your-org/vibe-coding-backend/issues)
- 📚 **文档反馈**: 提交PR改进文档
- 💬 **社区讨论**: [Discord频道](https://discord.gg/vibe-coding)

---

**最后更新**: 2024年1月15日  
**文档版本**: v1.0.0  
**适用版本**: vibe-coding-backend v1.0.0+