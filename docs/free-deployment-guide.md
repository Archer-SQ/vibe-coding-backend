# 完全免费部署方案指南

## 概述

本指南提供了将手势飞机大战后端服务部署到完全免费平台的详细步骤。我们已经移除了所有Vercel相关的配置，改为使用传统的Node.js Express架构，可以部署到多个免费平台。

## 项目改造完成情况

✅ **已完成的改造：**
- 移除了 `vercel.json` 配置文件
- 移除了 `@vercel/node` 依赖
- 将Vercel Serverless Functions转换为Express路由
- 创建了新的TypeScript Express应用 (`app.ts`)
- 更新了package.json脚本配置
- 保持了所有原有功能（健康检查、游戏提交、排行榜等）

## Railway 部署方案

### 🚂 Railway 优势
- **部署简单**：一键部署，自动检测项目类型
- **免费额度充足**：每月 500 小时运行时间
- **性能优秀**：快速启动，低延迟
- **配置简单**：支持环境变量管理
- **提供免费域名**：自动生成 HTTPS 域名
- **GitHub 集成**：支持自动部署
- **无需信用卡**：完全免费使用

## 详细部署步骤

### Railway 部署流程

#### 1. 准备工作

```bash
# 确保项目可以本地运行
pnpm install
pnpm run dev

# 测试API端点
curl http://localhost:3000/api/health

# 确保项目已推送到GitHub
git add .
git commit -m "准备Railway部署"
git push origin main
```

#### 2. 创建Railway项目

1. 访问 [railway.app](https://railway.app)
2. 使用GitHub账户登录
3. 验证邮箱
4. 点击 "New Project"
5. 选择 "Deploy from GitHub repo"
6. 选择你的项目仓库
7. Railway会自动检测Node.js项目

#### 3. 配置环境变量

在Railway项目设置中添加以下环境变量：

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=你的MongoDB连接字符串
MONGODB_DB_NAME=你的数据库名称
API_RATE_LIMIT=100
ENABLE_ANALYTICS=true
ENABLE_CACHE=false
```

#### 4. 部署配置

Railway会自动检测到你的`package.json`并使用正确的构建和启动命令：
- Build Command: `pnpm install`
- Start Command: `pnpm run start`

#### 5. 部署完成

- Railway会自动构建和部署
- 获取分配的域名（如：`your-app.railway.app`）
- 部署状态可在控制台实时查看

#### 6. 验证部署

```bash
# 测试健康检查
curl https://your-app.railway.app/api/health

# 测试排行榜API
curl https://your-app.railway.app/api/game/ranking?type=global&limit=10
```

### 免费MongoDB数据库方案

#### MongoDB Atlas（推荐）

1. 访问 [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. 创建免费账户
3. 创建免费集群（512MB存储）
4. 配置网络访问（允许所有IP：0.0.0.0/0）
5. 创建数据库用户
6. 获取连接字符串

#### 国内替代方案

**阿里云MongoDB：**
- 新用户有免费试用额度
- 学生认证可享受优惠

**腾讯云MongoDB：**
- 新用户免费额度
- 学生优惠计划

## 项目配置文件

### package.json关键配置

```json
{
  "name": "vibe-coding-backend",
  "version": "1.0.0",
  "description": "手势飞机大战后端服务 - Node.js Express架构",
  "main": "app.ts",
  "scripts": {
    "dev": "ts-node app.ts",
    "start": "ts-node app.ts",
    "build": "tsc",
    "test": "jest"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 环境变量配置

创建 `.env.production` 文件：

```env
# 生产环境配置
NODE_ENV=production
PORT=3000

# 数据库配置
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=vibe_coding_game

# 可选配置
API_RATE_LIMIT=100
ENABLE_ANALYTICS=true
ENABLE_CACHE=false
```

## 部署后测试

### 1. 健康检查

```bash
curl https://your-app.railway.app/api/health
```

预期响应：
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-08-14T08:13:22.888Z",
    "uptime": 123.456,
    "database": {
      "status": "skipped",
      "error": null
    },
    "environment": {
      "MONGODB_URI": true,
      "MONGODB_DB_NAME": true,
      "NODE_ENV": "production"
    },
    "version": "1.0.0"
  }
}
```

### 2. 游戏提交测试

```bash
curl -X POST https://your-app.railway.app/api/game/submit \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "a1b2c3d4e5f6789012345678901234567890abcd",
    "score": 1000
  }'
```

### 3. 排行榜测试

```bash
curl https://your-app.railway.app/api/game/ranking?type=all&limit=10
```

## 成本分析

### Railway 免费额度
- **运行时间**：500小时/月（约20天24小时运行）
- **内存**：512MB RAM
- **CPU**：共享vCPU
- **存储**：1GB 持久化存储
- **带宽**：100GB/月 出站流量
- **域名**：免费 .railway.app 子域名
- **数据库**：可连接外部数据库

### MongoDB Atlas 免费额度
- **存储**：512MB 数据存储
- **连接数**：500个并发连接
- **集群类型**：M0 沙盒集群
- **备份**：无自动备份（免费版）
- **网络**：基础网络访问

### 总成本
**完全免费** - 非常适合个人项目、学习项目和小型应用
- 无需信用卡验证
- 无隐藏费用
- 足够支撑中小型游戏后端服务

## 监控和维护

### Railway 内置监控
- **实时监控**：CPU、内存、网络使用情况
- **日志查看**：实时日志流，支持过滤和搜索
- **部署历史**：版本管理和一键回滚
- **健康检查**：自动检测服务状态，异常时自动重启
- **性能指标**：响应时间、错误率统计
- **资源使用**：实时显示资源消耗情况

### 应用层监控
项目已内置健康检查端点：
```bash
# 检查服务状态
curl https://your-app.railway.app/api/health

# 响应示例
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "version": "1.0.0"
}
```

### 日常维护
- **监控日志**：定期查看 Railway 控制台日志
- **性能检查**：关注响应时间和错误率
- **数据库监控**：通过 MongoDB Atlas 控制台监控数据库性能
- **更新部署**：推送代码到 GitHub 自动触发部署

## 故障排除

### 常见问题及解决方案

#### 1. Railway 部署失败
**症状**：部署过程中出现错误
```bash
# 解决步骤：
1. 检查 Railway 部署日志
2. 验证 package.json 中的脚本配置
3. 确认所有依赖都在 package.json 中
4. 检查 Node.js 版本兼容性
```

**常见原因**：
- `package.json` 中缺少 `start` 脚本
- 依赖安装失败
- Node.js 版本不兼容
- 构建超时

#### 2. 数据库连接失败
**症状**：API 返回数据库连接错误
```bash
# 解决步骤：
1. 检查 MONGODB_URI 环境变量
2. 确认 MongoDB Atlas IP 白名单设置为 0.0.0.0/0
3. 验证数据库用户名和密码
4. 检查网络访问权限
```

#### 3. API 请求失败
**症状**：前端无法访问 API
```bash
# 解决步骤：
1. 检查 CORS 配置
2. 验证 API 端点 URL
3. 查看 Railway 服务日志
4. 测试健康检查端点
```

#### 4. 服务启动失败
**症状**：Railway 显示服务无法启动
```bash
# 解决步骤：
1. 检查 PORT 环境变量设置
2. 确认启动脚本正确
3. 验证所有必需的环境变量
4. 查看详细错误日志
```

### 调试工具

#### 本地测试
```bash
# 使用生产环境变量本地测试
cp .env.example .env.local
# 编辑 .env.local 添加真实的数据库连接

# 本地运行测试
pnpm run dev
curl http://localhost:3000/api/health
```

#### Railway 日志查看
```bash
# 在 Railway 控制台查看：
1. 进入项目 Dashboard
2. 点击 "Deployments" 查看部署日志
3. 点击 "Logs" 查看运行时日志
4. 使用过滤器查找特定错误
```

#### 数据库调试
```bash
# 使用 MongoDB Compass 连接测试：
1. 下载 MongoDB Compass
2. 使用 MONGODB_URI 连接
3. 检查数据库和集合是否正常
4. 测试查询操作
```

## 扩展建议

### 1. 性能优化

- 启用Redis缓存（可使用免费的Upstash Redis）
- 实现数据库连接池
- 添加API响应缓存

### 2. 安全加固

- 配置CORS白名单
- 添加API限流
- 实现请求验证

### 3. 功能扩展

- 添加用户认证
- 实现数据分析
- 支持多语言

## 总结

通过以上步骤，你可以将手势飞机大战后端服务完全免费部署到云平台。推荐使用Railway作为主要部署平台，配合MongoDB Atlas免费数据库，可以满足开发和小规模生产需求。

如需更高性能和稳定性，可以考虑升级到付费方案，月成本约$14，性价比很高。